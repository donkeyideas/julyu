'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Theme = 'dark' | 'light' | 'green'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('julyu-theme') as Theme
    if (savedTheme && ['dark', 'light', 'green'].includes(savedTheme)) {
      setTheme(savedTheme)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      // Save theme to localStorage
      localStorage.setItem('julyu-theme', theme)
      // Apply theme class to document
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme, mounted])

  // Always render children so server-side rendering works for SEO crawlers.
  // Before mount, render children without theme context (uses CSS default theme).
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Return default values during SSR / before ThemeProvider mounts
  if (context === undefined) {
    return { theme: 'dark' as Theme, setTheme: () => {} }
  }
  return context
}
