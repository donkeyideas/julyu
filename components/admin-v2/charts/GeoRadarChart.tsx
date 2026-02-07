'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

interface GeoRadarChartProps {
  schemaTypes: string[]
}

const DESIRED_SCHEMAS = [
  { type: 'Organization', label: 'Organization' },
  { type: 'WebSite', label: 'WebSite' },
  { type: 'WebApplication', label: 'WebApp' },
  { type: 'FAQPage', label: 'FAQ' },
  { type: 'BreadcrumbList', label: 'Breadcrumb' },
  { type: 'Product', label: 'Product' },
  { type: 'HowTo', label: 'HowTo' },
  { type: 'LocalBusiness', label: 'Business' },
]

export default function GeoRadarChart({ schemaTypes }: GeoRadarChartProps) {
  const data = DESIRED_SCHEMAS.map(schema => ({
    subject: schema.label,
    value: schemaTypes.includes(schema.type) ? 100 : 0,
    fullMark: 100,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="var(--border-color)" />
        <PolarAngleAxis dataKey="subject" stroke="var(--text-muted)" fontSize={12} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
        <Radar
          name="Coverage"
          dataKey="value"
          stroke="#10b981"
          fill="#10b981"
          fillOpacity={0.3}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }}
          formatter={(value: number | undefined) => [value ? 'Present' : 'Missing', 'Status']}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
