-- Supabase SQL Editor, project owner. Run once in a new project.
BEGIN;
CREATE SCHEMA brandizzo_private;
REVOKE ALL ON SCHEMA brandizzo_private FROM PUBLIC, anon, authenticated;
CREATE TABLE brandizzo_private.admins(user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE);
CREATE TABLE brandizzo_private.borghi(name text PRIMARY KEY);
CREATE TABLE brandizzo_private.civics(id text PRIMARY KEY);
CREATE TABLE brandizzo_private.state(
  id boolean PRIMARY KEY DEFAULT true CHECK(id),
  revision bigint NOT NULL DEFAULT 0,
  colors jsonb NOT NULL DEFAULT '{}',
  assignments jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO brandizzo_private.state(id) VALUES(true);
CREATE TABLE brandizzo_private.history(
  revision bigint PRIMARY KEY, actor uuid NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now(), previous_colors jsonb NOT NULL,
  previous_assignments jsonb NOT NULL, patch jsonb NOT NULL
);
ALTER TABLE brandizzo_private.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE brandizzo_private.borghi ENABLE ROW LEVEL SECURITY;
ALTER TABLE brandizzo_private.civics ENABLE ROW LEVEL SECURITY;
ALTER TABLE brandizzo_private.state ENABLE ROW LEVEL SECURITY;
ALTER TABLE brandizzo_private.history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA brandizzo_private FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.brandizzo_snapshot() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT jsonb_build_object('revision',revision,'colors',colors,'assignments',assignments,'updated_at',updated_at)
  FROM brandizzo_private.state WHERE id=true
$$;
CREATE FUNCTION public.brandizzo_is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS(SELECT 1 FROM brandizzo_private.admins WHERE user_id=(SELECT auth.uid()))
$$;
CREATE FUNCTION public.brandizzo_save(expected_revision bigint, color_patch jsonb, assignment_patch jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE s brandizzo_private.state%ROWTYPE; k text; v jsonb;
BEGIN
  IF NOT public.brandizzo_is_admin() THEN RAISE EXCEPTION 'Accesso amministratore richiesto' USING ERRCODE='42501'; END IF;
  IF expected_revision IS NULL OR jsonb_typeof(color_patch) IS DISTINCT FROM 'object'
     OR jsonb_typeof(assignment_patch) IS DISTINCT FROM 'object'
     OR octet_length(color_patch::text)>10000 OR octet_length(assignment_patch::text)>1000000 THEN
    RAISE EXCEPTION 'Formato non valido' USING ERRCODE='22023';
  END IF;
  FOR k,v IN SELECT * FROM jsonb_each(color_patch) LOOP
    IF NOT EXISTS(SELECT 1 FROM brandizzo_private.borghi WHERE name=k)
       OR jsonb_typeof(v) IS DISTINCT FROM 'object'
       OR jsonb_typeof(v->'primary') IS DISTINCT FROM 'string'
       OR jsonb_typeof(v->'secondary') IS DISTINCT FROM 'string'
       OR (v->>'primary') !~ '^#[0-9a-fA-F]{6}$'
       OR (v->>'secondary') !~ '^#[0-9a-fA-F]{6}$'
       OR v - 'primary' - 'secondary' <> '{}'::jsonb THEN
      RAISE EXCEPTION 'Colore o borgo non valido' USING ERRCODE='22023';
    END IF;
  END LOOP;
  FOR k,v IN SELECT * FROM jsonb_each(assignment_patch) LOOP
    IF NOT EXISTS(SELECT 1 FROM brandizzo_private.civics WHERE id=k)
       OR jsonb_typeof(v) IS DISTINCT FROM 'string'
       OR NOT EXISTS(SELECT 1 FROM brandizzo_private.borghi WHERE name=v#>>'{}') THEN
      RAISE EXCEPTION 'Civico o borgo non valido' USING ERRCODE='22023';
    END IF;
  END LOOP;
  SELECT * INTO s FROM brandizzo_private.state WHERE id=true FOR UPDATE;
  IF s.revision<>expected_revision THEN
    RAISE EXCEPTION 'La mappa è stata modificata: ricarica prima di salvare' USING ERRCODE='40001';
  END IF;
  INSERT INTO brandizzo_private.history(revision,actor,previous_colors,previous_assignments,patch)
    VALUES(s.revision+1,auth.uid(),s.colors,s.assignments,jsonb_build_object('colors',color_patch,'assignments',assignment_patch));
  UPDATE brandizzo_private.state SET colors=s.colors||color_patch,assignments=s.assignments||assignment_patch,
    revision=s.revision+1,updated_at=now() WHERE id=true;
  RETURN public.brandizzo_snapshot();
END $$;
REVOKE ALL ON FUNCTION public.brandizzo_snapshot() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.brandizzo_is_admin() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.brandizzo_save(bigint,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.brandizzo_snapshot() TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.brandizzo_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.brandizzo_save(bigint,jsonb,jsonb) TO authenticated;
COMMIT;
