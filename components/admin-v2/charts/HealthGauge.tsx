'use client'

interface HealthGaugeProps {
  score: number
  size?: number
  label?: string
}

export default function HealthGauge({ score, size = 180, label = 'Overall Score' }: HealthGaugeProps) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const center = size / 2

  const getColor = (s: number) => {
    if (s >= 71) return '#10b981'
    if (s >= 41) return '#f59e0b'
    return '#ef4444'
  }

  const color = getColor(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="10"
          opacity={0.3}
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
        {/* Score text */}
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize="42"
          fontWeight="900"
        >
          {score}
        </text>
        <text
          x={center}
          y={center + 22}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-muted)"
          fontSize="13"
        >
          / 100
        </text>
      </svg>
      <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}
