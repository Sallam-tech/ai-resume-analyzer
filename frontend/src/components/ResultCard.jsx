export default function ResultCard({ title, items, color }) {
  return (
    <div className={`result-card ${color}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )
}