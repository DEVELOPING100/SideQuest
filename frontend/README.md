# Sidequest — Frontend

## Setup
```
npx create-react-app . 
# or: npm create vite@latest . -- --template react
npm install
```

## Owners
- Aljaberi: input screen + generated-adventure display (`src/screens/InputScreen`, `src/screens/AdventureScreen`)
- Sotonte: check-in flow + passport gallery (`src/screens/CheckinFlow`, `src/screens/PassportGallery`)

## Build against mock data first — don't wait on the backend
Copy `../docs/mock-data.json` into `src/mockApi.js` like this, and call these functions from your
components instead of `fetch` until backend endpoints are live:

```js
// src/mockApi.js
import mockData from '../../docs/mock-data.json';

export async function generateAdventure(timeMinutes, mode, interests) {
  // swap this for a real fetch('/api/adventures/generate', {...}) once backend is ready
  return mockData.generateAdventureResponse;
}

export async function checkinStop(adventureId, stopId) {
  return mockData.checkinResponse;
}

export async function getAdventure(adventureId) {
  return mockData.adventureDetailResponse;
}

export async function getPassport() {
  return mockData.passportResponse;
}
```

## Suggested folder layout
```
src/
  screens/
    InputScreen.jsx
    AdventureScreen.jsx
    CheckinFlow.jsx
    PassportGallery.jsx
  components/
    StampBadge.jsx
    MapView.jsx
  mockApi.js       # swap for real API calls at integration checkpoints
  api.js           # real fetch calls, matching docs/api-contract.md
  App.jsx
```

When backend endpoints are ready, only `mockApi.js` calls need to be swapped for `api.js` calls —
component code shouldn't need to change if the response shapes matched the contract.
