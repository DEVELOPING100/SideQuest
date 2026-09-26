#!/usr/bin/env bash

set -euo pipefail

SIDEQUEST_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SIDEQUEST_ENV_FILE="${SIDEQUEST_ROOT}/.env"

if [[ ! -f "${SIDEQUEST_ENV_FILE}" ]]; then
  echo "Missing ${SIDEQUEST_ENV_FILE}. Copy .env.example to .env first." >&2
  exit 1
fi

set -a
source "${SIDEQUEST_ENV_FILE}"
set +a

: "${SUPABASE_URL:?SUPABASE_URL is missing from .env}"
: "${SUPABASE_SECRET_KEY:?SUPABASE_SECRET_KEY is missing from .env}"

if [[ "${SUPABASE_URL}" != https://*.supabase.co ]]; then
  echo "SUPABASE_URL must look like https://your-project-reference.supabase.co" >&2
  exit 1
fi

if [[ "${SUPABASE_SECRET_KEY}" != sb_secret_* ]]; then
  echo "SUPABASE_SECRET_KEY must start with sb_secret_" >&2
  exit 1
fi

curl --fail --silent --show-error \
  "${SUPABASE_URL%/}/rest/v1/users?select=id,display_name&limit=1" \
  --header "apikey: ${SUPABASE_SECRET_KEY}"

printf '\n'
