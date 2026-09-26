# Sidequest API Contract (v3 — hybrid AI + user-designed adventures)

Lock this before writing feature code. If you need to change a shape, tell the whole team first.

---

## Core user inputs (kept simple, per team decision)
- `location` — lat/lng
- `budget` — number (dollars, e.g. `40`); use `0` for a free/no-budget adventure
- `timeMinutes` — integer

Everything else (groupSize, vibe, travelMode) is optional/cut for MVP — add back only if time allows.

---

## GET /api/places/nearby

Used for BOTH modes: AI mode uses this internally to get real candidates before calling OpenAI;
manual mode calls this directly so the user can browse and pick their own stops.

**Request (query params)**