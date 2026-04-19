export default function ScoreCircle({ score }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 75 ? '#22c55e' :
    score >= 50 ? '#eab308' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="rotate-[-90deg]" width="144" height="144">
        <circle
          cx="72" cy="72" r={radius}
          stroke="#1f2937"
          strokeWidth="12"
          fill="none"
        />
        <circle
          cx="72" cy="72" r={radius}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-gray-400 text-xs block">/ 100</span>
      </div>
    </div>
  )
}