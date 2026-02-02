#!/usr/bin/env bash
set -euo pipefail

# Helper to run destructive migrations safely in CI/test environments.
# Expects SUPABASE_DB_URL to be set in env (CI secret).

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required" >&2
  exit 1
fi

echo "Running migrations against $SUPABASE_DB_URL"

# Run psql in a single session that sets the guard GUC and includes the migration file
psql "$SUPABASE_DB_URL" -c "SET surya.reset_schema = 'true'; \i 'db/migrations/001_init.sql'"

echo "Migrations completed."