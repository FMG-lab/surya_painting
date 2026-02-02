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
# Set GUC then run migration
psql "$SUPABASE_DB_URL" -c "SET surya.reset_schema = 'true';" -f db/migrations/001_init.sql
```

Alternatively, invoke psql and set the GUC in the same call:

```bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "SET surya.reset_schema = 'true';" -f db/migrations/001_init.sql
```

You can also verify the seeded helper view after migration:

```bash
psql "$SUPABASE_DB_URL" -c "SELECT * FROM private.test_jwt_payloads;"
```

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

### Example test flow (CI)
1. Ensure the job is running on a test DB or set the GUC: `SET surya.reset_schema = 'true';` before applying migrations.
2. Apply `db/migrations/001_init.sql`.
3. Use `private.test_jwt_payloads` to inspect seeded users and create JWTs using `SUPABASE_SERVICE_ROLE_KEY`.
4. Run integration tests with Authorization header set.

## Additional notes
- The migration seeds `private.users` and `private.user_claims` and exposes `private.test_jwt_payloads` as a convenience for tests.
- For stronger isolation, consider running migrations in ephemeral DB instances per CI job.
- Do not run these migrations against production databases.
