import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/lib/theme/ThemeContext'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Julyu - Save $287/Month on Groceries with AI Price Comparison',
    template: '%s | Julyu',
  },
  description:
    'AI-powered grocery price comparison across 50+ retailers. Scan receipts, compare prices in real-time, and save an average of $287 every month. Join 127,000+ smart shoppers.',
  keywords: [
    'grocery price comparison',
    'food prices',
    'save money groceries',
    'grocery shopping app',
    'price tracker',
    'receipt scanner',
    'Kroger prices',
    'Walmart prices',
    'grocery deals',
    'weekly ads',
    'coupon finder',
    'shopping list app',
    'best grocery prices',
    'cheap groceries',
    'grocery budget',
  ],
  authors: [{ name: 'Julyu' }],
  creator: 'Julyu',
  publisher: 'Julyu',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Julyu',
    title: 'Julyu - The Bloomberg Terminal for Grocery Consumers',
    description:
      'AI-powered grocery price comparison across 50+ retailers. Save $287/month with professional-grade tools.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Julyu - AI-Powered Grocery Price Comparison',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Julyu - Save $287/Month on Groceries',
    description:
      'AI-powered grocery price comparison across 50+ retailers. Join 127,000+ smart shoppers.',
    images: ['/og-image.png'],
    creator: '@julyu',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: baseUrl,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#22c55e' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

// JSON-LD Structured Data
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${baseUrl}/#webapp`,
      name: 'Julyu',
      description: 'AI-powered grocery price comparison across 50+ retailers',
      url: baseUrl,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier available forever',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '12700',
        bestRating: '5',
        worstRating: '1',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: 'Julyu',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
      sameAs: [
        'https://twitter.com/julyu',
        'https://www.facebook.com/julyu',
        'https://www.instagram.com/julyu',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
      url: baseUrl,
      name: 'Julyu',
      description: 'AI-powered grocery price comparison',
      publisher: {
        '@id': `${baseUrl}/#organization`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased">
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RBCXZ4EWD5"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RBCXZ4EWD5');
          `}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
