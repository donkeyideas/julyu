'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface ScoreLineChartProps {
  data: Array<{
    created_at: string
    overall_score: number
    technical_score: number
    content_score: number
    structured_data_score: number
    performance_score: number
    geo_score: number
    aeo_score?: number | null
    cro_score?: number | null
  }>
}

const LINES = [
  { key: 'overall_score', color: '#10b981', name: 'Overall' },
  { key: 'technical_score', color: '#3b82f6', name: 'Technical' },
  { key: 'content_score', color: '#8b5cf6', name: 'Content' },
  { key: 'structured_data_score', color: '#f59e0b', name: 'Structured Data' },
  { key: 'performance_score', color: '#06b6d4', name: 'Performance' },
  { key: 'geo_score', color: '#ec4899', name: 'GEO' },
  { key: 'aeo_score', color: '#f97316', name: 'AEO' },
  { key: 'cro_score', color: '#14b8a6', name: 'CRO' },
]

export default function ScoreLineChart({ data }: ScoreLineChartProps) {
  const formattedData = data.map(d => ({
    ...d,
    // Ensure null/undefined AEO/CRO scores from old audits show as 0
    aeo_score: d.aeo_score ?? 0,
    cro_score: d.cro_score ?? 0,
    date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
        <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }}
        />
        <Legend />
        {LINES.map(line => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={{ fill: line.color, r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
