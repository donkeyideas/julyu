import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'

export const metadata: Metadata = {
  title: 'Pricing - Plans for Every Shopper',
  description:
    'Choose the Julyu plan that fits your needs. Free tier available forever. Premium plans unlock AI-powered savings, unlimited receipt scanning, and priority support.',
  openGraph: {
    title: 'Pricing - Plans for Every Shopper | Julyu',
    description:
      'Start saving on groceries for free. Upgrade to unlock the full power of AI price comparison across 50+ retailers.',
    url: `${baseUrl}/pricing`,
  },
  alternates: {
    canonical: `${baseUrl}/pricing`,
  },
}

const pricingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Julyu Pricing',
  description: 'Choose the Julyu plan that fits your needs. Free tier available forever.',
  url: `${baseUrl}/pricing`,
  mainEntity: {
    '@type': 'Product',
    name: 'Julyu Grocery Price Comparison',
    description: 'AI-powered grocery price comparison across 50+ retailers.',
    brand: { '@type': 'Brand', name: 'Julyu' },
    offers: [
      { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD', description: 'Free tier with basic features' },
      { '@type': 'Offer', name: 'Premium', price: '9.99', priceCurrency: 'USD', billingIncrement: 'P1M', description: 'Premium with unlimited features' },
    ],
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
      {children}
    </>
  )
}
