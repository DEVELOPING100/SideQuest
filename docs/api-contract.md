# Sidequest API Contract (v2 — updated for AI-generated adventures)

Lock this before writing feature code. If you need to change a shape, tell the whole team first —
this file is what lets frontend and backend build at the same time without blocking each other.

---

## POST /api/adventures/generate

Sends the user's full preferences. Backend uses Places API to find real nearby options, then sends
those options + preferences to OpenAI, which returns the final 2–4 stop adventure.

**Request**
```json
{
  "location": { "lat": 45.9636, "lng": -66.6431 },
  "budget": "medium",
  "timeMinutes": 120,
  "groupSize": 2,
  "vibe": "chill",
  "travelMode": "walking"
}
```

Field notes:
- `budget`: one of `"free"`, `"low"`, `"medium"`, `"high"` (keep it categorical, not a dollar amount — simpler for both AI prompting and UI, e.g. a segmented control)
- `groupSize`: integer, 1+
- `vibe`: one of `"chill"`, `"adventurous"`, `"foodie"`, `"cultural"`, `"social"` (pick your team's actual list and put it here once decided)
- `travelMode`: one of `"walking"`, `"biking"`, `"transit"`, `"driving"`

**Response**
```json
{
  "adventureId": "adv_123",
  "title": "A Chill Riverside Afternoon",
  "totalEstimatedMinutes": 110,
  "estimatedCost": "medium",
  "stops": [
    {
      "stopId": "s1",
      "name": "Riverfront Trail",
      "category": "nature",
      "estimatedMinutes": 30,
      "estimatedCost": "free",
      "lat": 45.9640,
      "lng": -66.6440,
      "order": 1,
      "aiReason": "A relaxed start that fits the chill vibe and works for a group of 2"
    },
    {
      "stopId": "s2",
      "name": "Local Café",
      "category": "food",
      "estimatedMinutes": 30,
      "estimatedCost": "low",
      "lat": 45.9650,
      "lng": -66.6420,
      "order": 2,
      "aiReason": "Low-cost coffee stop within walking distance"
    }
  ]
}
```

`aiReason` is optional but nice for the UI to show ("why this stop") — drop it if it slows the AI
integration down; the adventure still works without it.

---

## POST /api/adventures/{adventureId}/checkin

Unchanged shape from v1.

**Request**
```json
{ "stopId": "s1", "lat": 45.9640, "lng": -66.6440 }
```

**Response**
```json
{ "success": true, "stopId": "s1", "completedAt": "2026-09-26T14:32:00Z" }
```

If GPS isn't available or fails during the demo, the frontend can call this same endpoint with the
stop's own listed `lat`/`lng` as a simulated check-in fallback — no separate endpoint needed.

---

## GET /api/adventures/{adventureId}

**Response** — same shape as `generate`, with a `completed` flag added per stop:
```json
{
  "adventureId": "adv_123",
  "title": "A Chill Riverside Afternoon",
  "totalEstimatedMinutes": 110,
  "stops": [
    { "stopId": "s1", "name": "Riverfront Trail", "category": "nature", "estimatedMinutes": 30, "lat": 45.9640, "lng": -66.6440, "order": 1, "completed": true },
    { "stopId": "s2", "name": "Local Café", "category": "food", "estimatedMinutes": 30, "lat": 45.9650, "lng": -66.6420, "order": 2, "completed": false }
  ]
}
```

---

## GET /api/passport

**Response**
```json
{
  "userId": "u1",
  "stamps": [
    {
      "stampId": "st1",
      "adventureId": "adv_123",
      "title": "A Chill Riverside Afternoon",
      "earnedAt": "2026-09-26T15:00:00Z",
      "stopCount": 2
    }
  ]
}
```

---

## Rules for changing this file
1. Propose the change to the team before implementing it on either side.
2. Update this file and `mock-data.json` together.
3. Whoever changes it pings both frontend and backend leads.

## Open items to settle as a team today (before building the preference form)
- [ ] Finalize the exact list of `vibe` options
- [ ] Confirm `budget` stays categorical, not a numeric range
- [ ] Confirm whether `aiReason` ships in the demo or gets cut for time
