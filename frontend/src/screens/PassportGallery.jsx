import mockData from '../../../docs/mock-data.json'
import Stamp from '../components/Stamp.jsx'

export default function PassportGallery() {
  const stamps = mockData.passportResponse.stamps

  return (
    <main style={{ padding: '24px', textAlign: 'left' }}>
      <h1>Adventure Passport</h1>
      {stamps.length === 0 ? (
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
