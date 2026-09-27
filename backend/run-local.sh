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

cd "${SIDEQUEST_ROOT}/backend"
exec ./mvnw spring-boot:run
