'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface SearchConsoleChartProps {
  data: Array<{
    date?: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
  metric: 'clicks_impressions' | 'ctr' | 'position'
}

export default function SearchConsoleChart({ data, metric }: SearchConsoleChartProps) {
  const formattedData = data.map(d => ({
    ...d,
    date: d.date ? new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    ctrPercent: Math.round(d.ctr * 10000) / 100,
    positionRounded: Math.round(d.position * 10) / 10,
  }))

  if (metric === 'clicks_impressions') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
          <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} />
          <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
            }}
          />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="impressions" name="Impressions" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="clicks" name="Clicks" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (metric === 'ctr') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
          <YAxis stroke="var(--text-muted)" fontSize={12} unit="%" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
            }}
            formatter={(value: number | undefined) => [`${value ?? 0}%`, 'CTR']}
          />
          <Line type="monotone" dataKey="ctrPercent" name="CTR" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // position
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
        <YAxis reversed stroke="var(--text-muted)" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }}
          formatter={(value: number | undefined) => [value ?? 0, 'Avg Position']}
        />
        <Line type="monotone" dataKey="positionRounded" name="Position" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
