'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface CroBreakdownChartProps {
  ctaPresence: number
  formAccessibility: number
  loadSpeed: number
  trustSignals: number
  socialProof: number
  valueProp: number
  mobileCro: number
}

function getBarColor(score: number): string {
  if (score >= 71) return '#10b981'
  if (score >= 41) return '#f59e0b'
  return '#ef4444'
}

export default function CroBreakdownChart({ ctaPresence, formAccessibility, loadSpeed, trustSignals, socialProof, valueProp, mobileCro }: CroBreakdownChartProps) {
  const data = [
    { name: 'CTA Presence', score: ctaPresence },
    { name: 'Form Access.', score: formAccessibility },
    { name: 'Load Speed', score: loadSpeed },
    { name: 'Trust Signals', score: trustSignals },
    { name: 'Social Proof', score: socialProof },
    { name: 'Value Prop', score: valueProp },
    { name: 'Mobile CRO', score: mobileCro },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
        <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
        <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={80} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }}
          formatter={(value: number | undefined) => [`${value ?? 0}/100`, 'Score']}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={getBarColor(entry.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
