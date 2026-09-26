# Sidequest — Backend

## Setup (Spring Boot example — swap for Node/Express if the team prefers)
```
# Spring Initializr (start.spring.io): Web, JPA, PostgreSQL Driver
# or: npm init && npm install express pg cors dotenv
```

## Owners
- David: adventure-generation logic + Places API integration
- Parfait: database schema + distance/walk-time API integration

## Endpoint checklist (must match docs/api-contract.md exactly)
- [ ] `POST /api/adventures/generate`
- [ ] `POST /api/adventures/{adventureId}/checkin`
- [ ] `GET /api/adventures/{adventureId}`
- [ ] `GET /api/passport`

## Suggested folder layout
```
backend/
  src/
    controllers/    # route handlers
    services/       # adventure-generation logic, places API client, distance API client
    models/         # User, Adventure, Stop, Stamp entities
    repositories/   # DB access
  schema.sql        # starter table definitions (below)
```

## Starter schema (adjust as needed)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  time_minutes INT,
  mode TEXT,
  total_estimated_minutes INT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID REFERENCES adventures(id),
  name TEXT,
  category TEXT,
  estimated_minutes INT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  stop_order INT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP
);

CREATE TABLE stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  adventure_id UUID REFERENCES adventures(id),
  title TEXT,
  stop_count INT,
  earned_at TIMESTAMP DEFAULT now()
);
```

## Notes
- Return exactly the field names in `docs/api-contract.md` — frontend is building against those verbatim.
- Get one endpoint returning hardcoded data matching the contract FIRST (even before real DB/Places
  integration) — that unblocks frontend integration early even if your logic isn't finished yet.
