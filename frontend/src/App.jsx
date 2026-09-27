import { useState } from 'react'
import CheckinFlow from './screens/CheckinFlow.jsx'

// Temporary demo preferences until the preferences screen is connected.
const demoPreferences = {
  mode: 'manual',
  location: { lat: 45.9636, lng: -66.6431 },
  budget: 40,
  timeMinutes: 120,
  groupSize: 2,
  selectedPlaceIds: ['p1', 'p2', 'p3'],
}

function App() {
  const [adventure, setAdventure] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generateAdventure() {
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/adventures/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoPreferences),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || `Generation failed (HTTP ${response.status}).`)
      }
      if (!data?.adventureId || !Array.isArray(data.stops)) {
        throw new Error('The server did not return a valid adventure.')
      }

      // Keep the complete response, including the saved IDs and coordinates.
      setAdventure(data)
    } catch (err) {
      setError(err.message || 'Unable to generate an adventure. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section aria-label="Demo adventure generator" style={{ padding: '24px', textAlign: 'left' }}>
        <p>Temporary demo: generate a three-stop adventure for two people with a $40 budget and 120 minutes.</p>
        <button type="button" onClick={generateAdventure} disabled={loading}>
          {loading ? 'Generating...' : adventure ? 'Generate another adventure' : 'Generate demo adventure'}
        </button>
        {loading && <p role="status">Generating your adventure...</p>}
        {error && <p role="alert">{error}</p>}
      </section>
      {adventure && <CheckinFlow key={adventure.adventureId} adventure={adventure} />}
    </>
  )
}

export default App
