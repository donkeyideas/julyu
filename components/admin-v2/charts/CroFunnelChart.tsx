'use client'

import type { StoredPageScore } from '@/lib/seo/types'

interface CroFunnelChartProps {
  pageScores: StoredPageScore[]
}

export default function CroFunnelChart({ pageScores }: CroFunnelChartProps) {
  const total = pageScores.length
  if (total === 0) {
    return <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No page data available</div>
  }

  // Visit: all pages scanned (100%)
  const visitCount = total

  // Engage: pages with meaningful content + CTAs (word_count > 100 or cta_count > 0)
  const engageCount = pageScores.filter(p =>
    (p.word_count > 100) || ((p.cta_count || 0) > 0)
  ).length

  // Convert: pages with strong CRO readiness (forms or CTA score >= 50)
  const convertCount = pageScores.filter(p =>
    ((p.form_count || 0) > 0) || ((p.cta_presence_score || 0) >= 50)
  ).length

  const stages = [
    { label: 'Visit', count: visitCount, pct: 100, color: '#10b981' },
    { label: 'Engage', count: engageCount, pct: Math.round((engageCount / total) * 100), color: '#f59e0b' },
    { label: 'Convert', count: convertCount, pct: Math.round((convertCount / total) * 100), color: '#8b5cf6' },
  ]

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => (
        <div key={stage.label} className="flex items-center gap-4">
          <div className="w-20 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {stage.label}
          </div>
          <div className="flex-1 relative">
            <div
              className="h-10 rounded-lg flex items-center px-3 transition-all"
              style={{
                width: `${Math.max(stage.pct, 8)}%`,
                backgroundColor: stage.color,
                opacity: 0.85,
              }}
            >
              <span className="text-sm font-bold text-black whitespace-nowrap">
                {stage.count}/{total} pages ({stage.pct}%)
              </span>
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        Conversion readiness funnel — measures how many pages are optimized at each stage
      </p>
    </div>
  )
}
