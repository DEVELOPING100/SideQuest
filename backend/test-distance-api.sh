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

: "${DISTANCE_API_KEY:?DISTANCE_API_KEY is missing from .env}"

SIDEQUEST_ROUTE_RESPONSE="$(
  curl --fail --silent --show-error \
    --request POST \
    --url "https://api.heigit.org/openrouteservice/v2/directions/foot-walking" \
    --header "Authorization: ${DISTANCE_API_KEY}" \
    --header "Content-Type: application/json" \
    --data '{
      "coordinates": [
        [-66.6431, 45.9636],
        [-66.6419, 45.9648],
        [-66.6410, 45.9655]
      ],
      "geometry": false
    }'
)"

SIDEQUEST_ROUTE_RESPONSE="${SIDEQUEST_ROUTE_RESPONSE}" python3 - <<'PY'
import json
import os

data = json.loads(os.environ["SIDEQUEST_ROUTE_RESPONSE"])
route = data["routes"][0]
summary = route["summary"]
names = ["Riverfront Trail", "Local Cafe", "Hidden Mural Wall"]

print(
    f"Total walking distance: {summary['distance'] / 1000:.2f} km\n"
    f"Total walking time: {summary['duration'] / 60:.1f} minutes"
)

for index, segment in enumerate(route.get("segments", [])):
    print(
        f"{names[index]} -> {names[index + 1]}: "
        f"{segment['distance']:.0f} m, {segment['duration'] / 60:.1f} minutes"
    )
PY
