import { useState } from 'react'   
import mockData from '../../../docs/mock-data.json'//

export default function CheckinFlow() {
  // Start with a newly generated adventure: none of its stops are completed yet.
  const [stops, setStops] = useState(() =>
    mockData.generateAdventureResponse.stops.map((stop) => ({
      ...stop,
      completed: false,
    })),
  )

  // Calculate these from state so the count and message always match the stops.
  const completedCount = stops.filter((stop) => stop.completed).length
  const adventureComplete = stops.length > 0 && completedCount === stops.length

  function handleCheckin(stopId) {
    // The updater receives the latest state. map creates a new array instead
    // of changing the existing state or the shared mock data directly.
    setStops((currentStops) =>
      currentStops.map((stop) =>
        stop.stopId === stopId && !stop.completed
          ? { ...stop, completed: true }
          : stop,
      ),
    )
  }

  return (
    <main style={{ padding: '24px', textAlign: 'left' }}>
      <h1>Adventure check-in</h1>
      <p>Simulated check-ins for now. Progress resets when you refresh.</p>
      <p role="status">
        {completedCount} of {stops.length} stops completed.
        {adventureComplete && ' Adventure complete!'}
      </p>

      {stops.length === 0 && <p>No stops available to check in to.</p>}
      <ol>
        {stops.map((stop) => (
          <li key={stop.stopId} style={{ marginBottom: '24px' }}>
            <h2>{stop.name}</h2>
            <p>{stop.category} · {stop.estimatedMinutes} minutes</p>
            <p>{stop.completed ? 'Completed' : 'Incomplete'}</p>
            <button
              type="button"
              disabled={stop.completed}
              onClick={() => handleCheckin(stop.stopId)}
              aria-label={stop.completed
                ? `${stop.name} completed`
                : `Simulate check-in at ${stop.name}`}
            >
              {stop.completed ? 'Checked in' : 'Simulate check-in'}
            </button>
          </li>
        ))}
      </ol>
    </main>
  )
}
