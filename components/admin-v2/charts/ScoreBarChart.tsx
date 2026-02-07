'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ScoreBarChartProps {
  data: Array<{
    page_path: string
    overall_score: number
  }>
}

const getBarColor = (score: number) => {
  if (score >= 71) return '#10b981'
  if (score >= 41) return '#f59e0b'
  return '#ef4444'
}

export default function ScoreBarChart({ data }: ScoreBarChartProps) {
  const sorted = [...data].sort((a, b) => b.overall_score - a.overall_score)

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 40)}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
        <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
        <YAxis type="category" dataKey="page_path" stroke="var(--text-muted)" fontSize={12} width={80} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }}
          formatter={(value: number | undefined) => [`${value ?? 0}/100`, 'Score']}
        />
        <Bar dataKey="overall_score" radius={[0, 4, 4, 0]}>
          {sorted.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.overall_score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
