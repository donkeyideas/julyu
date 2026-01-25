import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Julyu - Grocery Price Comparison',
    short_name: 'Julyu',
    description: 'AI-powered grocery price comparison across 50+ retailers. Save $287/month with professional-grade tools.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#22c55e',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
