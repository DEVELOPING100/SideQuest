// Holds the adventure the user is currently playing, shared between screens.
let current = null;

export function setCurrentAdventure(adventure) {
  current = adventure;
}

export function getCurrentAdventure() {
  return current;
}

function titleCase(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

// Convert backend stops into the shape the screens and AdventureMap use.
export function toScreenStops(adventure) {
  if (!adventure || !Array.isArray(adventure.stops)) return [];
  return adventure.stops.map((stop) => {
    const walk = stop.travelMinutesFromPrevious > 0
      ? `${stop.travelMinutesFromPrevious} min walk`
      : 'Start here';
    return {
      id: stop.stopId,
      stopId: stop.stopId,
      name: stop.name,
      description: stop.description,
      detail: `${titleCase(stop.category)} \u00b7 ${walk}`,
      minutes: stop.estimatedMinutes,
      completed: !!stop.completed,
      lat: stop.lat,
      lng: stop.lng,
      coordinate: { latitude: stop.lat, longitude: stop.lng },
    };
  });
}
