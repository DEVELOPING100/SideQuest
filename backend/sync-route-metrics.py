#!/usr/bin/env python3

"""Calculate route metrics for an adventure and save them to Supabase."""

from __future__ import annotations

import json
import math
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = PROJECT_ROOT / ".env"
ORS_DIRECTIONS_URL = (
    "https://api.heigit.org/openrouteservice/v2/directions/{profile}"
)
TRAVEL_PROFILES = {
    "walk": "foot-walking",
    "walking": "foot-walking",
    "bike": "cycling-regular",
    "biking": "cycling-regular",
    "cycling": "cycling-regular",
    "car": "driving-car",
    "driving": "driving-car",
}


def load_env(path: Path) -> None:
    if not path.exists():
        raise RuntimeError(f"Missing {path}. Copy .env.example to .env first.")

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        name, value = line.split("=", 1)
        os.environ.setdefault(name.strip(), value.strip().strip('"').strip("'"))


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is missing from .env")
    return value


def json_request(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body: Any | None = None,
) -> Any:
    encoded_body = None
    request_headers = dict(headers or {})

    if body is not None:
        encoded_body = json.dumps(body).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    request = urllib.request.Request(
        url,
        data=encoded_body,
        headers=request_headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response_body = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        details = error.read().decode("utf-8")
        raise RuntimeError(f"HTTP {error.code}: {details}") from error

    return json.loads(response_body) if response_body else None


def supabase_url(base_url: str, table: str, query: dict[str, str]) -> str:
    encoded_query = urllib.parse.urlencode(query, safe=".,()")
    return f"{base_url.rstrip('/')}/rest/v1/{table}?{encoded_query}"


def load_adventure(
    base_url: str, api_headers: dict[str, str], adventure_id: str
) -> dict[str, Any]:
    adventures = json_request(
        supabase_url(
            base_url,
            "adventures",
            {
                "id": f"eq.{adventure_id}",
                "select": "id,title,travel_mode",
            },
        ),
        headers=api_headers,
    )

    if not adventures:
        raise RuntimeError(f"Adventure {adventure_id} was not found")

    return adventures[0]


def load_stops(
    base_url: str, api_headers: dict[str, str], adventure_id: str
) -> list[dict[str, Any]]:
    stops = json_request(
        supabase_url(
            base_url,
            "stops",
            {
                "adventure_id": f"eq.{adventure_id}",
                "select": "id,name,latitude,longitude,stop_order",
                "order": "stop_order.asc",
            },
        ),
        headers=api_headers,
    )

    if len(stops) < 2:
        raise RuntimeError("An adventure needs at least two stops for routing")

    return stops


def calculate_segments(
    distance_api_key: str,
    travel_mode: str,
    stops: list[dict[str, Any]],
) -> tuple[str, dict[str, Any]]:
    profile = TRAVEL_PROFILES.get(travel_mode.lower())
    if profile is None:
        supported = ", ".join(sorted(TRAVEL_PROFILES))
        raise RuntimeError(
            f"Unsupported travel mode '{travel_mode}'. Supported values: {supported}"
        )

    coordinates = [
        [float(stop["longitude"]), float(stop["latitude"])] for stop in stops
    ]
    route = json_request(
        ORS_DIRECTIONS_URL.format(profile=profile),
        method="POST",
        headers={"Authorization": distance_api_key},
        body={"coordinates": coordinates, "geometry": False},
    )["routes"][0]

    if len(route.get("segments", [])) != len(stops) - 1:
        raise RuntimeError("Routing response did not include every stop-to-stop segment")

    return profile, route


def update_stop(
    base_url: str,
    api_headers: dict[str, str],
    stop_id: str,
    distance_meters: int,
    travel_minutes: int,
) -> None:
    json_request(
        supabase_url(base_url, "stops", {"id": f"eq.{stop_id}"}),
        method="PATCH",
        headers={**api_headers, "Prefer": "return=minimal"},
        body={
            "distance_from_previous_meters": distance_meters,
            "travel_minutes_from_previous": travel_minutes,
        },
    )


def sync_route_metrics(adventure_id: str) -> None:
    load_env(ENV_FILE)
    base_url = require_env("SUPABASE_URL")
    supabase_key = require_env("SUPABASE_SECRET_KEY")
    distance_api_key = require_env("DISTANCE_API_KEY")
    api_headers = {"apikey": supabase_key}

    adventure = load_adventure(base_url, api_headers, adventure_id)
    stops = load_stops(base_url, api_headers, adventure_id)
    profile, route = calculate_segments(
        distance_api_key,
        adventure["travel_mode"],
        stops,
    )

    update_stop(base_url, api_headers, stops[0]["id"], 0, 0)
    print(f"{stops[0]['name']}: starting point")

    for index, segment in enumerate(route["segments"], start=1):
        distance_meters = round(segment["distance"])
        travel_minutes = math.ceil(segment["duration"] / 60)
        stop = stops[index]
        update_stop(
            base_url,
            api_headers,
            stop["id"],
            distance_meters,
            travel_minutes,
        )
        print(
            f"{stop['name']}: {distance_meters} m and "
            f"{travel_minutes} min from previous stop"
        )

    summary = route["summary"]
    print(
        f"Saved {profile} route for {adventure.get('title') or adventure_id}: "
        f"{summary['distance'] / 1000:.2f} km, "
        f"{summary['duration'] / 60:.1f} min total"
    )


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(f"Usage: {Path(sys.argv[0]).name} <adventure-id>")

    try:
        sync_route_metrics(sys.argv[1])
    except (RuntimeError, ValueError, KeyError, urllib.error.URLError) as error:
        raise SystemExit(f"Route sync failed: {error}") from error


if __name__ == "__main__":
    main()
