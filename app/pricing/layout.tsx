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

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
