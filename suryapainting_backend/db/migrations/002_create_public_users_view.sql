-- 002_create_public_users_view.sql
-- Create a `public.users` view that maps to `private.users` so PostgREST policies referencing `users` resolve correctly.
-- This fixes "Could not find the table 'public.users' in the schema cache" and permission issues caused by missing public users table.

DROP VIEW IF EXISTS public.users CASCADE;
CREATE VIEW public.users AS
SELECT * FROM private.users;

-- Ensure the view is readable by the usual roles used by Supabase REST
GRANT SELECT ON public.users TO public;
GRANT SELECT ON public.users TO authenticated;

-- Also create a view for user_claims if other policies refer to it
DROP VIEW IF EXISTS public.user_claims CASCADE;
CREATE VIEW public.user_claims AS
SELECT * FROM private.user_claims;
GRANT SELECT ON public.user_claims TO public;
GRANT SELECT ON public.user_claims TO authenticated;
