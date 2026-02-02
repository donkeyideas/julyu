export const colors = {
  // Primary
  primary: '#22c55e',
  primaryLight: '#4ade80',
  primaryDark: '#16a34a',

  // Background
  background: '#000000',
  card: '#111827',
  cardHover: '#1f2937',

  // Borders
  border: '#1f2937',
  borderLight: '#374151',

  // Text
  text: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  textPlaceholder: '#4b5563',

  // Status
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Gradients
  gradientStart: '#22c55e',
  gradientEnd: '#16a34a',

  // Glassmorphism
  glass: {
    background: 'rgba(17, 24, 39, 0.7)',
    backgroundLight: 'rgba(31, 41, 55, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.15)',
    highlight: 'rgba(255, 255, 255, 0.05)',
  },
}

// Gradient color pairs for LinearGradient
export const gradients = {
  primary: ['#22c55e', '#16a34a'] as const,
  accent: ['#3b82f6', '#1d4ed8'] as const,
  purple: ['#8b5cf6', '#7c3aed'] as const,
  orange: ['#f97316', '#ea580c'] as const,
  dark: ['#1f2937', '#111827'] as const,
  background: ['#000000', '#0a0a0a', '#111827'] as const,
  authBackground: ['#000000', '#022c22', '#000000'] as const,
  homeBackground: ['#000000', '#0d1f17', '#000000'] as const,
  scanBackground: ['#000000', '#1e1b4b', '#000000'] as const,
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
}

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
}
