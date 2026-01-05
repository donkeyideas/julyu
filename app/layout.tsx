import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Julyu - The Bloomberg Terminal for Grocery Consumers',
  description: 'AI-powered grocery price comparison platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

