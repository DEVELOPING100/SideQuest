import { useEffect, useState } from 'react'
import Stamp from '../components/Stamp.jsx'

export default function PassportGallery() {
  const [stamps, setStamps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadPassport() {
      try {
        const response = await fetch('/api/passport', {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Unable to load passport (HTTP ${response.status}).`)
        }

        const data = await response.json()
        if (!Array.isArray(data.stamps)) {
          throw new Error('The passport response did not contain a stamps array.')
        }

        if (!controller.signal.aborted) {
          setStamps(data.stamps)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message || 'Unable to load passport. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadPassport()
    return () => controller.abort()
  }, [])

  return (
    <main style={{ padding: '24px', textAlign: 'left' }}>
      <h1>Adventure Passport</h1>
      {loading ? (
        <p role="status">Loading passport...</p>
      ) : error ? (
        <p role="alert">{error} Refresh to try again.</p>
      ) : stamps.length === 0 ? (
        <p>No stamps yet. Complete an adventure to earn your first stamp.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {stamps.map((stamp) => (
            <li key={stamp.stampId} style={{ marginBottom: '16px' }}>
              <Stamp title={stamp.title} stopCount={stamp.stopCount} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
