# Sidequest API Contract

Lock this before writing feature code. If you need to change a shape, tell the whole team first —
this file is what lets frontend and backend build at the same time without blocking each other.

---

## POST /api/adventures/generate

**Request**
```json
{
  "timeMinutes": 90,
  "mode": "walking",
  "lat": 45.9636,
  "lng": -66.6431,
  "interests": ["food", "nature"]
}
```

**Response**
```json
{
  "adventureId": "adv_123",
  "totalEstimatedMinutes": 85,
  "stops": [
    {
      "stopId": "s1",
      "name": "Riverfront Trail",
      "category": "nature",
      "estimatedMinutes": 25,
      "lat": 45.9640,
      "lng": -66.6440,
      "order": 1
    },
    {
      "stopId": "s2",
      "name": "Local Café",
      "category": "food",
      "estimatedMinutes": 20,
      "lat": 45.9650,
      "lng": -66.6420,
      "order": 2
    }
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

---

## GET /api/adventures/{adventureId}

**Response** — same shape as `generate`, with a `completed` flag added per stop:
```json
{
  "adventureId": "adv_123",
  "totalEstimatedMinutes": 85,
  "stops": [
    { "stopId": "s1", "name": "Riverfront Trail", "category": "nature", "estimatedMinutes": 25, "lat": 45.9640, "lng": -66.6440, "order": 1, "completed": true },
    { "stopId": "s2", "name": "Local Café", "category": "food", "estimatedMinutes": 20, "lat": 45.9650, "lng": -66.6420, "order": 2, "completed": false }
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
      "title": "Fredericton Explorer",
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
