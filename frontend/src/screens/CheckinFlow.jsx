import { useState } from 'react'   
import mockData from '../../../docs/mock-data.json'//
import Stamp from '../components/Stamp.jsx'

export default function CheckinFlow({ adventure = mockData.generateAdventureResponse }) {
  // Start with a newly generated adventure: none of its stops are completed yet.
  const [stops, setStops] = useState(() =>
    adventure.stops.map((stop) => ({
      ...stop,
      completed: false,
    })),
  )

  const [pendingStops, setPendingStops] = useState({})
  const [errors, setErrors] = useState({})

  // Calculate these from state so the count and message always match the stops.
  const completedCount = stops.filter((stop) => stop.completed).length
  const adventureComplete = stops.length > 0 && completedCount === stops.length
  const adventureTitle = adventure.title ?? 'Adventure completed'

  async function handleCheckin(stopId) {
    const stop = stops.find((item) => item.stopId === stopId)
    if (!stop || stop.completed || pendingStops[stopId]) return

    setPendingStops((current) => ({ ...current, [stopId]: true }))
    setErrors((current) => ({ ...current, [stopId]: '' }))

    try {
      const adventureId = adventure.adventureId
      const response = await fetch(`/api/adventures/${encodeURIComponent(adventureId)}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Use this stop's coordinates until browser GPS is connected.
        body: JSON.stringify({ stopId, lat: stop.lat, lng: stop.lng }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || `Check-in failed (HTTP ${response.status}).`)
      }
      if (data?.success !== true || data.stopId !== stopId) {
        throw new Error('The server did not confirm this stop\'s check-in.')
      }

      setStops((currentStops) =>
        currentStops.map((item) =>
          item.stopId === stopId
            ? { ...item, completed: true, completedAt: data.completedAt }
            : item,
        ),
      )
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [stopId]: error.message || 'Unable to check in. Please try again.',
      }))
    } finally {
      setPendingStops((current) => ({ ...current, [stopId]: false }))
    }
  }

  return (
    <main style={{ padding: '24px', textAlign: 'left' }}>
      <h1>Adventure check-in</h1>
      <p>Using each stop's coordinates for check-in. Check-ins are saved, but this screen's progress resets when you refresh.</p>
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
              disabled={stop.completed || pendingStops[stop.stopId]}
              onClick={() => handleCheckin(stop.stopId)}
              aria-label={stop.completed
                ? `${stop.name} completed`
                : pendingStops[stop.stopId]
                  ? `Checking in at ${stop.name}`
                  : `Check in at ${stop.name}`}
            >
              {stop.completed ? 'Checked in' : pendingStops[stop.stopId] ? 'Checking in...' : 'Check In'}
            </button>
            {errors[stop.stopId] && <p role="alert">{errors[stop.stopId]} Please try again.</p>}
          </li>
        ))}
      </ol>
      {adventureComplete && (
        <Stamp title={adventureTitle} stopCount={stops.length} />
      )}
    </main>
  )
}
