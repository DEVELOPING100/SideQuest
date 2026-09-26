# Sidequest

Turn your free time into a short local adventure — and collect a passport stamp for finishing it.

## Team & Roles
- Person 1 — Frontend: core screens (input + generated adventure)
- Person 2 — Frontend: passport & check-in
- Person 3 — Backend: API & adventure-generation logic
- Person 4 — Backend: database & external API integration

## How this repo is organized
```
sidequest/
  frontend/       # React app — see frontend/README.md
  backend/        # API server — see backend/README.md
  docs/
    api-contract.md   # THE shared contract — read this first, everyone
    mock-data.json     # sample responses frontend can build against immediately
```

## Getting started
1. Clone the repo, each person works on their own branch (see docs/api-contract.md and the project outline doc for branching convention)
2. Read `docs/api-contract.md` before writing any code — it's what lets frontend and backend build in parallel
3. Frontend devs: start from `docs/mock-data.json` — hardcode it into your components so you're not blocked waiting on the backend
4. Backend devs: build endpoints to match the contract exactly — shapes matter more than implementation details right now
5. Integrate at the checkpoints in the timeline — swap mock data for real API calls

## API Keys (never commit real values)
Create a `.env` file (gitignored) with:
```
PLACES_API_KEY=
DISTANCE_API_KEY=
DATABASE_URL=
```
