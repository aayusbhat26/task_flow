#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Run deploy/bootstrap-oracle.sh first." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required." >&2
  exit 1
fi

if [ ! -f .env ]; then
  cp env.production.example .env
  chmod 600 .env

  PUBLIC_IP="$(curl -fsS https://api.ipify.org 2>/dev/null || true)"
  if [ -n "$PUBLIC_IP" ]; then
    sed -i "s|^DOMAIN=.*|DOMAIN=${PUBLIC_IP}.sslip.io|" .env
  fi

  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" .env
  sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$(openssl rand -hex 32)|" .env
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 32)|" .env
  echo "Created deploy/.env with generated secrets."
  echo "Review DOMAIN and OAuth/billing values before going public."
fi

if grep -q '^DOMAIN=change-me' .env; then
  echo "Set DOMAIN in deploy/.env first." >&2
  exit 1
fi

if grep -q '^POSTGRES_PASSWORD=replace-with' .env; then
  echo "Set a strong POSTGRES_PASSWORD in deploy/.env first." >&2
  exit 1
fi

if grep -q '^NEXTAUTH_SECRET=replace-with' .env || grep -q '^JWT_SECRET=replace-with' .env; then
  echo "Set NEXTAUTH_SECRET and JWT_SECRET in deploy/.env first." >&2
  exit 1
fi

echo "Building and starting TaskFlow..."
docker compose --env-file .env -f docker-compose.prod.yml up -d --build --remove-orphans

echo
docker compose --env-file .env -f docker-compose.prod.yml ps
echo
DOMAIN="$(grep '^DOMAIN=' .env | cut -d= -f2-)"
echo "TaskFlow is starting at https://${DOMAIN}"
echo "TLS may take a few seconds on first boot. Follow logs with:"
echo "  cd deploy && docker compose --env-file .env -f docker-compose.prod.yml logs -f caddy web"
