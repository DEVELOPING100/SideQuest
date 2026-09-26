# Sidequest — Backend

## Setup

Requirements: Java 17 or newer and a root `.env` file based on `.env.example`.

From the repository root:

```bash
./backend/run-local.sh
```

The script loads the ignored `.env` file and starts Spring Boot on `http://localhost:8080`.

## Owners
- David: adventure-generation logic + Places API integration
- Parfait: database schema + distance/walk-time API integration

## Endpoint checklist (must match docs/api-contract.md exactly)
- [x] `GET /api/places/nearby`
- [x] `POST /api/adventures/generate` (manual mode)
- [x] `POST /api/adventures/{adventureId}/checkin`
- [x] `GET /api/adventures/{adventureId}`
- [x] `GET /api/passport`

## Folder layout
```
backend/
  src/main/java/com/sidequest/backend/
    controllers/    # HTTP endpoints
    services/       # adventure, Supabase, places, and routing logic
    models/         # request, response, place, and route records
  schema.sql        # Supabase table definitions and access grants
  seed.sql          # repeatable demo data
  run-local.sh      # loads ../.env and starts Spring Boot
```

## Current generation flow

`POST /api/adventures/generate` selects the requested demo places, asks OpenRouteService for
walking distance and travel time, then saves the adventure and ordered stops to Supabase. The API
returns the response shape in `docs/api-contract.md` with real UUIDs.

## Notes
- Return exactly the field names in `docs/api-contract.md` — frontend is building against those verbatim.
- The current place catalog is intentionally hardcoded until David connects the real Places API.
- Supabase secret keys and routing keys are backend-only and must never be placed in frontend code.
