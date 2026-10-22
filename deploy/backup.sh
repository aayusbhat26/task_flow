#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "deploy/.env is missing." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

mkdir -p backups
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="backups/taskflow-${STAMP}.sql.gz"

docker compose --env-file .env -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-taskflow}" -d "${POSTGRES_DB:-taskflow}" \
  | gzip -9 > "$FILE"

if [ ! -s "$FILE" ]; then
  echo "Backup failed: $FILE is empty" >&2
  exit 1
fi

# Keep two weeks locally on the free block volume.
find backups -type f -name 'taskflow-*.sql.gz' -mtime +14 -delete

# Optional: install rclone and set RCLONE_REMOTE=r2:taskflow-backups
# in deploy/.env for an additional free-tier offsite copy.
if [ -n "${RCLONE_REMOTE:-}" ] && command -v rclone >/dev/null 2>&1; then
  rclone copy "$FILE" "$RCLONE_REMOTE"
fi

echo "Backup written to $FILE"
