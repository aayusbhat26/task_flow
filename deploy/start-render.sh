#!/bin/sh
set -eu

# Render supplies PORT for the public listener and RENDER_EXTERNAL_URL for the
# service hostname. A custom domain can override NEXTAUTH_URL explicitly.
export NEXTAUTH_URL="${NEXTAUTH_URL:-${RENDER_EXTERNAL_URL:-}}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-${NEXTAUTH_URL}}"
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-${NEXTAUTH_URL}}"
export AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://127.0.0.1:3003}"
export PRISMA_HIDE_UPDATE_MESSAGE="1"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required (use the pooled Neon connection string)." >&2
  exit 1
fi
if [ -z "${DIRECT_URL:-}" ]; then
  echo "DIRECT_URL is required (use the direct Neon connection string)." >&2
  exit 1
fi

mkdir -p /app/web/public/uploads
chown -R node:node /app/web/public/uploads

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running Prisma migrations against DIRECT_URL..."
  attempt=1
  migration_ok=0
  while [ "$attempt" -le 8 ]; do
    if prisma migrate deploy --schema=/app/prisma/schema.prisma; then
      migration_ok=1
      break
    fi
    echo "Migration attempt $attempt failed. Retrying in 5s..."
    attempt=$((attempt + 1))
    sleep 5
  done

  if [ "$migration_ok" -ne 1 ]; then
    echo "Prisma migrations failed after retries. Check DATABASE_URL, DIRECT_URL and Neon status." >&2
    exit 1
  fi
fi

if [ "${SEED_CURATED_QUESTIONS:-true}" = "true" ]; then
  echo "Seeding curated DSA questions if needed..."
  if ! (cd /app/web && node seed-curated.js); then
    echo "Warning: curated DSA seeding failed; continuing startup." >&2
  fi
fi

echo "Starting TaskFlow processes (web, auth, socket, proxy) on PORT=${PORT:-10000}..."
exec supervisord -n -c /app/supervisord.conf
