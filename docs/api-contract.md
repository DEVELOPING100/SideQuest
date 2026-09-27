# SideQuest API Contract (v4 - matches the real backend)

This describes what the backend on `main` actually returns. Frontend: call these through
`frontend/src/api.js`, which Vite forwards to the backend on localhost:8080.

---

## GET /api/places/nearby

Query: `?lat=45.9636&lng=-66.6431&budget=40&timeMinutes=120&groupSize=2`

Returns real Fredericton places (from OpenStreetMap). Use `placeId` for manual mode.

```json
{
  "places": [
    { "placeId": "p1", "name": "Officers' Square", "category": "park", "description": "Historic square in the downtown Garrison District, an easy starting point for a walk.", "estimatedMinutes": 20, "estimatedCost": 0.0, "lat": 45.9618651, "lng": -66.6389938 }
  ]
}
```

Categories in use: `park`, `nature`, `food`, `activity`, `art`, `culture`.

---

## POST /api/adventures/generate

**AI mode** (AI picks 2-4 stops):
```json
{ "mode": "ai", "location": { "lat": 45.9636, "lng": -66.6431 }, "budget": 30, "timeMinutes": 120, "groupSize": 2 }
```

**Manual mode** (user picks at least 2 places by `placeId`):
```json
{ "mode": "manual", "location": { "lat": 45.9636, "lng": -66.6431 }, "budget": 30, "timeMinutes": 120, "groupSize": 2, "selectedPlaceIds": ["p1", "p9", "p16"] }
```

Rules: `budget` >= 0 (dollars, total), `timeMinutes` > 0, `groupSize` > 0.

**Response** (saved to the database):
```json
{
  "adventureId": "8e7b0168-fad2-4a2f-9420-4a9ee2372dc2",
  "title": "Officers' Square to Gallery 78",
  "mode": "ai",
  "totalEstimatedMinutes": 90,
  "stops": [
    { "stopId": "fc7f9b0b-5767-4306-b365-38b3e20de1fb", "name": "Officers' Square", "category": "park", "description": "...", "estimatedMinutes": 20, "lat": 45.9618651, "lng": -66.6389938, "order": 1 }
  ]
}
```

- `stopId` and `adventureId` are UUIDs. Keep them, since check-in needs both.
- `totalEstimatedMinutes` = time at the stops + walking time between them.
- `title` is built from the first and last stop.

---

## GET /api/adventures/{adventureId}

Same as the generate response, plus per stop:
- `distanceFromPreviousMeters`: walking distance from the previous stop (0 for the first)
- `travelMinutesFromPrevious`: walking minutes from the previous stop (0 for the first)
- `completed`: true once checked in

Known issue: `mode` always reads back as `"manual"` here (not saved yet, needs a DB column).

---

## POST /api/adventures/{adventureId}/checkin

**Request**
```json
{ "stopId": "fc7f9b0b-5767-4306-b365-38b3e20de1fb", "lat": 45.9618651, "lng": -66.6389938 }
```
**Response**
```json
{ "success": true, "stopId": "fc7f9b0b-5767-4306-b365-38b3e20de1fb", "completedAt": "2026-09-27T03:15:00Z" }
```

- The check-in location must be **within 150 m** of the stop, or it fails.
- **For the demo**, use `checkInAtStop(adventureId, stop, { useGps: false })` from `api.js`. It sends the stop's own coordinates, so it always passes.
- When the **last** stop is checked in, the adventure is marked complete and a **stamp is created automatically**.

---

## GET /api/passport

```json
{
  "userId": "11111111-1111-4111-8111-111111111111",
  "stamps": [
    { "stampId": "44444444-4444-4444-8444-444444444444", "adventureId": "8e7b0168-fad2-4a2f-9420-4a9ee2372dc2", "title": "Officers' Square to Gallery 78", "mode": "manual", "earnedAt": "2026-09-27T03:20:00Z", "stopCount": 3 }
  ]
}
```

Single demo user for now. Newest stamps first.

---

## Errors
- **400**: bad input (missing fields, fewer than 2 places, too far from a stop to check in)
- **502**: an outside service failed (database)
- `api.js` turns these into a thrown `Error` with the message, so wrap calls in try/catch and show the message.

## Not built yet
- Saving `mode` (needs a DB column)
- Photo memories on stamps (stretch goal)
- Cities outside Fredericton (Atlantic expansion, stretch goal)
