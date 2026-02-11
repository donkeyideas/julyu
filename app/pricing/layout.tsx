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

const pricingFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is Julyu free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Julyu offers a free tier that includes basic price comparison across nearby stores, a limited shopping list, and weekly price alerts. The free plan is available forever with no credit card required.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does the Premium plan include?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Premium plan at $9.99/month unlocks unlimited receipt scanning, AI-powered product matching across 50+ retailers, route optimization, real-time price alerts, spending analytics, and priority customer support.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel my subscription at any time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, you can cancel your Julyu subscription at any time with no cancellation fees. Your premium features remain active until the end of your current billing period, and you can always continue using the free tier.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much money can I save with Julyu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Julyu users save an average of $287 per month on groceries by comparing prices across multiple stores. Savings vary based on shopping habits, location, and the number of stores in your area.',
      },
    },
  ],
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }} />
      {children}
    </>
  )
}
