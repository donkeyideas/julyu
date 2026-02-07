'use client'

import { useRouter } from 'next/navigation'
import { clearDemoSession } from '@/lib/demo/utils/demo-auth'

export default function DemoBanner() {
  const router = useRouter()

  const handleExit = () => {
    clearDemoSession()
    router.push('/')
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 text-sm font-medium"
      style={{
        background: 'linear-gradient(90deg, #92400e, #b45309, #92400e)',
        color: '#fef3c7',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-amber-900/50 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
          Demo Mode
        </span>
        <span>You are viewing a demonstration with simulated data.</span>
      </div>
      <button
        onClick={handleExit}
        className="rounded px-3 py-1 text-xs font-semibold transition hover:bg-amber-900/50"
      >
        Exit Demo
      </button>
    </div>
  )
}
