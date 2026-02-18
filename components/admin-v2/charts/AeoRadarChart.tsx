'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

interface AeoRadarChartProps {
  schemaRichness: number
  faqCoverage: number
  directAnswer: number
  entityMarkup: number
  speakable: number
  aiSnippet: number
}

export default function AeoRadarChart({ schemaRichness, faqCoverage, directAnswer, entityMarkup, speakable, aiSnippet }: AeoRadarChartProps) {
  const data = [
    { subject: 'Schema Richness', value: schemaRichness, fullMark: 100 },
    { subject: 'FAQ Coverage', value: faqCoverage, fullMark: 100 },
    { subject: 'Direct Answer', value: directAnswer, fullMark: 100 },
    { subject: 'Entity Markup', value: entityMarkup, fullMark: 100 },
    { subject: 'Speakable', value: speakable, fullMark: 100 },
    { subject: 'AI Snippet', value: aiSnippet, fullMark: 100 },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="var(--border-color)" />
        <PolarAngleAxis dataKey="subject" stroke="var(--text-muted)" fontSize={11} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
        <Radar
          name="AEO Score"
          dataKey="value"
          stroke="#f97316"
          fill="#f97316"
          fillOpacity={0.3}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }}
          formatter={(value: number | undefined) => [`${value ?? 0}/100`, 'Score']}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
