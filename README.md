# Surya Painting

Initial main branch.

## Roles & Authorization

- A lightweight middleware helper is available at `lib/server/auth.ts` (helpers: `getUserFromReq`, `requireRole`) which is used by admin endpoints such as `api/admin/staff`.
- For local tests/dev you can set `x-user-role` and `x-user-id` headers (or use `Authorization: Bearer <token>` with `admin-token`, `manager-token`, `tech-token`) to simulate authenticated requests.

## Row Level Security (RLS)

- Example RLS policies are in `db/supabase_rls.sql` — adapt them to your schema and enable RLS per-table in Supabase.
