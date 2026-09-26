# Sidequest API Contract (v3 — hybrid AI + user-designed adventures)

Lock this before writing feature code. If you need to change a shape, tell the whole team first.

---

## Core user inputs (kept simple, per team decision)
- `location` — lat/lng
- `budget` — number (dollars, e.g. `40`); use `0` for a free/no-budget adventure
- `timeMinutes` — integer
- `groupSize` — integer, 1+ (how many people)

Everything else (vibe, travelMode) is optional/cut for MVP — add back only if time allows.

---

## GET /api/places/nearby

Used for BOTH modes: AI mode uses this internally to get real candidates before calling OpenAI;
manual mode calls this directly so the user can browse and pick their own stops.

**Request (query params)**

?lat=45.9636&lng=-66.6431&budget=40&timeMinutes=120&groupSize=2


**Response**
```json
{
  "places": [
    { "placeId": "p1", "name": "Riverfront Trail", "category": "nature", "description": "A flat, scenic walking path along the river, good for a relaxed pace.", "estimatedMinutes": 30, "estimatedCost": 0, "lat": 45.9640, "lng": -66.6440 },
    { "placeId": "p2", "name": "Local Café", "category": "food", "description": "Small independent café known for its cold brew and quiet upstairs seating.", "estimatedMinutes": 30, "estimatedCost": 8, "lat": 45.9650, "lng": -66.6420 },
    { "placeId": "p3", "name": "Hidden Mural Wall", "category": "art", "description": "A large street-art mural tucked behind a downtown parking lot.", "estimatedMinutes": 20, "estimatedCost": 0, "lat": 45.9655, "lng": -66.6410 }
  ]
}
```

---

## POST /api/adventures/generate

`mode` decides the path. Both modes return the exact same response shape, so the frontend's
adventure screen doesn't need to know or care which mode created it.

**Request — AI mode**
```json
{
  "mode": "ai",
  "location": { "lat": 45.9636, "lng": -66.6431 },
  "budget": 40,
  "timeMinutes": 120,
  "groupSize": 2
}
```
Backend calls `/api/places/nearby` internally, sends the results + budget/time to OpenAI, gets back
a 2–4 stop plan.

**Request — manual mode**
```json
{
  "mode": "manual",
  "location": { "lat": 45.9636, "lng": -66.6431 },
  "budget": 40,
  "timeMinutes": 120,
  "groupSize": 2,
  "selectedPlaceIds": ["p1", "p2", "p3"]
}
```
Backend just assembles the user's chosen places (from `/api/places/nearby`) into an adventure record
— no AI call needed, so this path is actually simpler to build first if time is tight.

**Response (same for both modes)**
```json
{
  "adventureId": "adv_123",
  "title": "A Chill Riverside Afternoon",
  "mode": "ai",
  "totalEstimatedMinutes": 110,
  "stops": [
    { "stopId": "s1", "name": "Riverfront Trail", "category": "nature", "description": "A flat, scenic walking path along the river, good for a relaxed pace.", "estimatedMinutes": 30, "lat": 45.9640, "lng": -66.6440, "order": 1 },
    { "stopId": "s2", "name": "Local Café", "category": "food", "description": "Small independent café known for its cold brew and quiet upstairs seating.", "estimatedMinutes": 30, "lat": 45.9650, "lng": -66.6420, "order": 2 }
  ]
}
```

---

## POST /api/adventures/{adventureId}/checkin

**Request**
```json
{ "stopId": "s1", "lat": 45.9640, "lng": -66.6440 }
```
**Response**
```json
{ "success": true, "stopId": "s1", "completedAt": "2026-09-26T14:32:00Z" }
```
If GPS fails during the demo, call this same endpoint using the stop's own listed `lat`/`lng` as a
simulated check-in — no separate endpoint needed.

---

## GET /api/adventures/{adventureId}

Same shape as `generate`'s response, with a `completed` flag added per stop.

---

## GET /api/passport

```json
{
  "userId": "u1",
  "stamps": [
    { "stampId": "st1", "adventureId": "adv_123", "title": "A Chill Riverside Afternoon", "mode": "ai", "earnedAt": "2026-09-26T15:00:00Z", "stopCount": 2 }
  ]
}
```

---

## Build order suggestion (given it's demo day)
1. `/api/places/nearby` first — unblocks manual mode entirely, and is a prerequisite for AI mode anyway
2. Manual mode's `generate` — no AI dependency, gets you a working end-to-end demo fastest
3. AI mode as the "wow" layer on top, once manual mode already works

## Rules for changing this file
1. Propose the change to the team before implementing it.
2. Update this file and `mock-data.json` together.
3. Whoever changes it pings both frontend and backend leads.