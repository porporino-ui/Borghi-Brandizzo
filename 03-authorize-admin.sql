-- First create the account in Supabase Authentication > Users.
-- Replace the placeholder with its UUID, then run from SQL Editor.
-- Do not paste your password here or into a GitHub file.
INSERT INTO brandizzo_private.admins(user_id)
VALUES ('4eadaf4c-77bc-40ac-9e0c-3faa74902d71'::uuid)
ON CONFLICT DO NOTHING;

-- To revoke permissions immediately, run in SQL Editor:
-- DELETE FROM brandizzo_private.admins WHERE user_id='UUID-UTENTE'::uuid;
