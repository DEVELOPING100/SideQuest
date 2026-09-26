# SideQuest

Turn your free time into a short local adventure — and collect a passport stamp for finishing it.

SideQuest generates a personalized adventure based on your location, budget, available time, group, vibe, and travel method — using real local places.

## The problem

People often feel that there is not much to do nearby. The experiences exist, but finding activities that fit a budget and schedule — and turning them into a complete outing — takes time and effort.

SideQuest does that research for the user. The goal is simple: spend less time searching and more time experiencing.

## Demo target

- Preferences — enter a location, budget, available time, group, vibe, and travel mode
- AI-generated adventure — create an itinerary with 2–4 real stops
- Route — display the stops on a map with travel time between them
- Check-in — use GPS check-in, with a simulated check-in as a fallback
- Passport stamp — earn a digital stamp after completing the adventure
- Passport gallery — save and display completed adventures and past stamps

The minimum viable demo is:

```
Preferences → AI adventure → Real stops → Check-in → Stamp → Saved passport
```

## Team & Roles

- Azeez — Frontend: preference input, generated adventure, stop list, map, and backend connection
- Sotonte — Frontend: check-in flow, digital stamp, Adventure Passport, and completion states
- David — Backend: Spring Boot API, Places API, OpenAI integration, and adventure generation
- Parfait — Backend: Supabase, saved adventures and stamps, distance API, and final integration

## Tech stack

- Frontend: React / Next.js
- Backend: Spring Boot (Java)
- AI: OpenAI API
- Database: Supabase (PostgreSQL)
- Places data: Google Places API or OpenTripMap
- Map: Mapbox or Google Maps
- Distance and routing: OpenRouteService or Google Distance Matrix
- Deployment: Vercel
- Design and collaboration: Figma and GitHub

## How this repo is organized

```
sidequest/
  frontend/           # Next.js / React app — see frontend/README.md
  backend/            # Spring Boot API — see backend/README.md
  docs/
    api-contract.md   # shared request and response contract — read this first
    mock-data.json    # sample responses frontend can build against immediately
  README.md           # project information and setup instructions
```

## Getting started

1. Clone the repo and work on your assigned feature branch.
2. Read `docs/api-contract.md` before writing code — it lets frontend and backend build in parallel.
3. Frontend developers should begin with `docs/mock-data.json` instead of waiting for the backend.
4. Backend developers should build endpoints that match the API contract exactly.
5. Integrate at the planned checkpoints by replacing mock data with real API calls.

## Running the project

### Prerequisites

- Node.js and npm
- Java 17 or newer
- A Supabase project
- Credentials for the selected external services

### Clone the repository

```bash
git clone https://github.com/DEVELOPING100/SideQuest.git
cd SideQuest
```

### Start the backend

```bash
cd backend
./mvnw spring-boot:run
```

If the Spring Boot project uses Gradle, run `./gradlew bootRun` instead.

### Start the frontend

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Next.js.

## API Keys (never commit real values)

Create a local `.env` file with:

```
OPENAI_API_KEY=
PLACES_API_KEY=
DISTANCE_API_KEY=
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

Keep the real `.env` file in `.gitignore`. Never push API keys to GitHub, and never expose `SUPABASE_SECRET_KEY` in frontend code.

## GitHub workflow

- Keep `main` stable and ready to demo.
- Work on your own feature branch and make small, clear commits.
- Push changes to GitHub and open a Pull Request when the feature works.
- Have at least one teammate review the Pull Request.
- Merge tested frontend and backend work into `main` at integration checkpoints.
- Never experiment directly on `main`.

Feature branches:

```
frontend/adventure-screen       # Azeez
frontend/passport-checkin       # Sotonte
backend/ai-generation           # David
backend/supabase-distance       # Parfait
```

## Stretch goals

- Social passports with sharing, comments, and comparisons
- Improved GPS check-in and map interactions
- UI animations and more detailed stamp designs
- Support for additional cities

## Main rule

`main` should always contain a version that the team can demo. A complete core experience is more valuable than several unfinished features.
