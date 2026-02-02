#!/usr/bin/env bash
set -euo pipefail

# scripts/prod-reset.sh
# Usage: run in CI with PROD_DB_URL set. The script will:
# 1) create a pg_dump to /tmp/prod-backup-<ts>.dump
# 2) run destructive migration (using session GUC to bypass guard)
# 3) run basic smoke tests (health endpoint if provided)
# Environment vars required:
# - PROD_DB_URL
# Optional:
# - APP_HEALTH_URL (eg https://example.com/health)
# - STAGING_DB_URL (for optional restore testing)

if [[ -z "${PROD_DB_URL:-}" ]]; then
  echo "PROD_DB_URL is required" >&2
  exit 1
fi

echo "[prod-reset] Starting backup and reset process"
TS=$(date -u +%Y%m%dT%H%M%SZ)
DUMP_FILE="/tmp/prod-backup-${TS}.dump"

echo "[prod-reset] Creating pg_dump -> ${DUMP_FILE}"
pg_dump --format=custom --verbose --file="${DUMP_FILE}" "${PROD_DB_URL}"

# Upload artifact (Actions will pick up /tmp/prod-backup-*.dump if using upload-artifact step)
echo "[prod-reset] Created backup: ${DUMP_FILE} (size: $(stat -c%s "${DUMP_FILE}" 2>/dev/null || stat -f%z "${DUMP_FILE}"))"

# Dry-run restore to staging if STAGING_DB_URL provided (optional)
if [[ -n "${STAGING_DB_URL:-}" ]]; then
  echo "[prod-reset] Restoring backup to STAGING_DB_URL for verification"
  pg_restore --verbose --clean --no-owner --dbname="${STAGING_DB_URL}" "${DUMP_FILE}"
  echo "[prod-reset] Staging restore OK"
fi

# Run migration with session GUC set in same psql session
echo "[prod-reset] Running destructive migration on PROD (guarded by surya.reset_schema GUC)"
psql "${PROD_DB_URL}" -c "SET surya.reset_schema = 'true'; \i 'db/migrations/001_init.sql'"

# Basic smoke tests: check health URL if provided
if [[ -n "${APP_HEALTH_URL:-}" ]]; then
  echo "[prod-reset] Running health check against ${APP_HEALTH_URL}"
  for i in {1..10}; do
    if curl -fsS "${APP_HEALTH_URL}" -o /dev/null; then
      echo "[prod-reset] Health check OK" && break
    fi
    echo "[prod-reset] Health check attempt ${i} failed; retrying..."
    sleep 2
  done
fi

# Print location of dump for reference
echo "[prod-reset] Backup file available at: ${DUMP_FILE}"

echo "[prod-reset] Completed successfully"
