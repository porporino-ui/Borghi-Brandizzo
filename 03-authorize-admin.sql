-- First create the account in Supabase Authentication > Users.
-- Replace the placeholder with its UUID, then run from SQL Editor.
-- Do not paste your password here or into a GitHub file.
INSERT INTO brandizzo_private.admins(user_id)
VALUES ('1f902b7f-998b-402f-babd-b83a3bc5fd8e'::uuid)
ON CONFLICT DO NOTHING;

-- To revoke permissions immediately, run in SQL Editor:
-- DELETE FROM brandizzo_private.admins WHERE user_id='UUID-UTENTE'::uuid;
