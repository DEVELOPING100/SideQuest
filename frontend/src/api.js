// SideQuest API client
// Screens should call these functions instead of importing mock-data.json.
// During development, Vite forwards /api/... to the backend on localhost:8080.

const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message || body.error || JSON.stringify(body);
    } catch {
      // response had no JSON body
    }
    throw new Error(`Request failed (${res.status}): ${message}`);
  }
  return res.json();
}

// Nearby places the user can pick from (manual mode)
export function getNearbyPlaces({ lat, lng, budget, timeMinutes, groupSize = 1 }) {
  const params = new URLSearchParams({ lat, lng, budget, timeMinutes, groupSize });
  return request(`/places/nearby?${params}`);
}

// Generate an adventure.
// mode: 'ai' (AI picks the stops) or 'manual' (pass selectedPlaceIds)
export function generateAdventure({ mode, lat, lng, budget, timeMinutes, groupSize, selectedPlaceIds }) {
  return request('/adventures/generate', {
    method: 'POST',
    body: JSON.stringify({
      mode,
      location: { lat, lng },
      budget,
      timeMinutes,
      groupSize,
      selectedPlaceIds: mode === 'manual' ? selectedPlaceIds : undefined,
    }),
  });
}

// Load a saved adventure (each stop includes a `completed` flag)
export function getAdventure(adventureId) {
  return request(`/adventures/${adventureId}`);
}

// Check in at a stop.
// stopId must be the UUID from the adventure's stops, e.g. "fc7f9b0b-...", not "s1"
export function checkIn(adventureId, { stopId, lat, lng }) {
  return request(`/adventures/${adventureId}/checkin`, {
    method: 'POST',
    body: JSON.stringify({ stopId, lat, lng }),
  });
}

// Check in using real GPS if available, otherwise fall back to the stop's own
// coordinates (simulated check-in, safe for indoor demos)
export async function checkInAtStop(adventureId, stop, { useGps = true } = {}) {
  let lat = stop.lat;
  let lng = stop.lng;
  if (useGps && navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // GPS denied or timed out: keep the simulated coordinates
    }
  }
  return checkIn(adventureId, { stopId: stop.stopId, lat, lng });
}

// The user's passport: all earned stamps
export function getPassport() {
  return request('/passport');
}
