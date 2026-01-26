'use client'

import { useTheme, Theme } from '@/lib/theme/ThemeContext'

const themes: { value: Theme; label: string; icon: JSX.Element; color: string }[] = [
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    color: 'bg-gray-900'
  },
  {
    value: 'light',
    label: 'Cream',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: 'bg-amber-100'
  },
  {
    value: 'green',
    label: 'Green',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: 'bg-green-600'
  }
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--bg-card)' }}>
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`flex items-center justify-center w-8 h-8 rounded-md transition-all ${
            theme === t.value
              ? 'bg-green-500 text-black'
              : 'hover:opacity-80'
          }`}
          style={{
            color: theme === t.value ? 'black' : 'var(--text-secondary)'
          }}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}
    </div>
  )
}
