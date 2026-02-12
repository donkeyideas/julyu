'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ResponseTimeChartProps {
  data: Array<{
    page_path: string
    response_time_ms: number
  }>
}

const getBarColor = (ms: number) => {
  if (ms < 500) return '#10b981'
  if (ms < 1000) return '#f59e0b'
  return '#ef4444'
}

export default function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  const sorted = [...data].sort((a, b) => a.response_time_ms - b.response_time_ms)

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 40)}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
        <XAxis type="number" domain={[0, 'auto']} stroke="var(--text-muted)" fontSize={12} unit="ms" />
        <YAxis type="category" dataKey="page_path" stroke="var(--text-muted)" fontSize={12} width={80} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }}
          formatter={(value: number | undefined) => [`${value ?? 0}ms`, 'Response Time']}
        />
        <Bar dataKey="response_time_ms" radius={[0, 4, 4, 0]}>
          {sorted.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.response_time_ms)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
