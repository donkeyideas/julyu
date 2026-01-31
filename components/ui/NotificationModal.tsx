'use client'

import { useEffect } from 'react'

interface NotificationModalProps {
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  onClose: () => void
  autoClose?: number // milliseconds, 0 to disable
}

export default function NotificationModal({
  message,
  type = 'info',
  onClose,
  autoClose = 3000,
}: NotificationModalProps) {
  useEffect(() => {
    if (autoClose > 0) {
      const timer = setTimeout(onClose, autoClose)
      return () => clearTimeout(timer)
    }
  }, [autoClose, onClose])

  const iconColors = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
  }

  const icons = {
    info: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-6 animate-in fade-in zoom-in duration-200"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 ${iconColors[type]}`}>
            {icons[type]}
          </div>
          <p className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            {message}
          </p>
          <button
            onClick={onClose}
            className="px-8 py-2 bg-green-500 text-black font-black rounded-xl hover:bg-green-400 transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
