# Migrations & CI runbook — Safe destructive resets and generating test JWTs

## Safe destructive migration (DROP CASCADE)
The `db/migrations/001_init.sql` migration will drop and recreate `public` and `private` schemas.
**This is destructive** — only run against test or CI databases.

Guarding logic (in the migration) will refuse to run unless one of the following is true:
- session GUC `surya.reset_schema = 'true'`, OR
- database name contains `test`, OR
- current DB user contains `ci`.

### Examples
Run with a session GUC set (psql):

```bash
# Set GUC then run migration (single psql session)
psql "$SUPABASE_DB_URL" -c "SET surya.reset_schema = 'true'; \i 'db/migrations/001_init.sql'"
```

Or use the repository helper script (recommended for CI):

```bash
# from repo root (requires SUPABASE_DB_URL in env)
chmod +x ./scripts/run-migrations-ci.sh
./scripts/run-migrations-ci.sh
```

You can also verify the seeded helper view after migration:

```bash
psql "$SUPABASE_DB_URL" -c "SELECT * FROM private.test_jwt_payloads;"
```

CI notes — running integration tests with app preview (two options):

- Option A (external preview / preview deployment):
  - Configure your preview provider (Vercel, Netlify, etc.) to deploy PRs and expose the preview URL.
  - Add `APP_URL` secret in repo secrets pointing to the preview URL. The CI job will use that URL and run auth integration tests against it.

- Option B (local app run inside the integration job):
  - If `APP_URL` secret is not set, the CI job will **build** and **start** the Next app at `http://localhost:3000` and set `APP_URL` automatically. This is a safe fallback so auth tests can still run without an external preview.

Optional: to enable automatic Vercel deployments from CI, add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets; the CI includes a non-fatal optional step that attempts a `vercel` deploy (you may prefer to use the Vercel GitHub integration instead).

---

# Manual destructive run (production)
We provide a manual GitHub Actions workflow `Drop Production Schema (manual)` that you can trigger from the Actions UI once required secrets are set.

Required secrets for this workflow:
- `PROD_DB_URL` (postgres connection string for production)
- (optional) `STAGING_DB_URL` (for restore verification)
- (optional) `APP_HEALTH_URL` (health endpoint to poll after migration)
- (optional) `SLACK_WEBHOOK` (notify channel)

How to run safely:
1. Add `PROD_DB_URL` (and optional secrets) in repository Settings → Secrets → Actions.
2. In GitHub UI go to Actions → "Drop Production Schema (manual)" → Run workflow → supply any inputs and run. The workflow will:
   - Create a `pg_dump` backup and upload it as an artifact named `prod-db-backup`.
   - Run `db/migrations/001_init.sql` with guard GUC set.
   - Run optional smoke tests against `APP_HEALTH_URL`.
3. If anything fails, download the artifact and restore using `pg_restore` as needed.

**WARNING:** The migration will remove ALL objects in `public` and `private` schemas. Only run this on purpose and during maintenance window.

## Generating test JWTs for integration tests
If your integration tests need to call authenticated endpoints, you can generate JWTs signed with the `SUPABASE_SERVICE_ROLE_KEY` (HS256).

> NOTE: Keep `SUPABASE_SERVICE_ROLE_KEY` secret. Only use it in CI/test environments.

### Quick Node one-liner

```bash
# export SUPABASE_SERVICE_ROLE_KEY in CI secrets
node -e "console.log(require('jsonwebtoken').sign({ sub: '00000000-0000-0000-0000-000000000001', email: 'admin@example.com', role: 'admin' }, process.env.SUPABASE_SERVICE_ROLE_KEY, { algorithm: 'HS256', expiresIn: '1h' }))"
```

Use the generated token in requests:

```bash
curl -H "Authorization: Bearer <JWT>" https://your-app.example/api/admin/branches
```

Or use the helper script in this repo to generate tokens from seeded users:

```bash
# from repo root, ensure env SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
cd apps/admin
npm run gen:test-jwt -- --email admin@example.com
```

To run the example authenticated integration test locally (requires a running app at APP_URL):

```bash
# set APP_URL (eg http://localhost:3000) and SUPABASE_ vars, then:
npm run test:integration
```
### Example test flow (CI)
1. Ensure the job is running on a test DB or set the GUC: `SET surya.reset_schema = 'true';` before applying migrations.
2. Apply `db/migrations/001_init.sql`.
3. Use `private.test_jwt_payloads` to inspect seeded users and create JWTs using `SUPABASE_SERVICE_ROLE_KEY`.
4. Run integration tests with Authorization header set.

## Additional notes
- The migration seeds `private.users` and `private.user_claims` and exposes `private.test_jwt_payloads` as a convenience for tests.
- For stronger isolation, consider running migrations in ephemeral DB instances per CI job.
- Do not run these migrations against production databases.
