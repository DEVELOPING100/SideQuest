export default function Stamp({ title, stopCount }) {
  return (
    <section
      aria-label="Earned adventure stamp"
      style={{ border: '1px solid currentColor', padding: '16px' }}
    >
      <h2>Adventure stamp earned!</h2>
      <p>{title}</p>
      <p>{stopCount} {stopCount === 1 ? 'stop' : 'stops'} completed</p>
    </section>
  )
}
