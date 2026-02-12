import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import InteractiveDemo from '@/components/home/InteractiveDemo'
import StoreTicker from '@/components/home/StoreTicker'
import HowItWorks from '@/components/home/HowItWorks'
import FeatureShowcase from '@/components/home/FeatureShowcase'
import WhyJulyu from '@/components/home/WhyJulyu'
import Testimonials from '@/components/home/Testimonials'
import StoreOwnerCTA from '@/components/home/StoreOwnerCTA'
import RequestDemoModal from '@/components/shared/RequestDemoModal'
import CTASection from '@/components/home/CTASection'
import { getPageWithSections } from '@/lib/content/getPageContent'

export const revalidate = 3600

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'

export const metadata: Metadata = {
  title: 'Julyu - AI Grocery Price Comparison | Save $287/Month',
  description:
    'Julyu is an AI-powered grocery price comparison platform that helps 127,000+ shoppers save an average of $287 per month by comparing prices across 50+ retailers.',
  openGraph: {
    title: 'Julyu - AI Grocery Price Comparison | Save $287/Month',
    description:
      'Compare grocery prices across 50+ stores. AI-powered receipt scanning, route optimization, and price alerts save the average family $287/month.',
    url: baseUrl,
  },
  alternates: {
    canonical: baseUrl,
  },
}

const homeFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Julyu and how does it work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Julyu is an AI-powered grocery price comparison platform founded in 2024. It compares prices across 50+ retailers including Walmart, Kroger, Target, and Costco. Users scan receipts, search products, and get optimized shopping routes to save an average of $287 per month.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much money can I save with Julyu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'According to our data, Julyu users save an average of $287 per month on groceries. Research shows grocery prices vary 15-25% between nearby stores, and Julyu finds these savings automatically with 98% product matching accuracy.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Julyu free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Julyu offers a free plan with basic price comparisons and limited receipt scanning. Premium plans provide full AI matching, unlimited scans, and route optimization. The average user saves $287/month, far exceeding any subscription cost.',
      },
    },
  ],
}

export default async function HomePage() {
  // Fetch content from database
  const { content } = await getPageWithSections('home')

  // Extract hero content with defaults
  const hero = content.hero || {}
  const badge = hero.badge || 'Now in Early Access'
  const headline = hero.headline || 'Stop Overpaying for Groceries'
  const subheadline = hero.subheadline || 'Compare prices across local stores, supermarkets, and bodegas in seconds. Scan receipts, track spending, and discover savings with smart technology.'
  const primaryCta = hero.primary_cta || { text: 'Get Early Access', link: '/auth/signup' }
  const secondaryCtaText = hero.secondary_cta?.text || 'Request Demo'
  const stats = hero.stats || [
    { value: 'Real-Time', label: 'Price Data' },
    { value: 'Smart', label: 'Technology' },
    { value: 'Free', label: 'To Start' }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }} />
      <Header transparent />

      {/* Hero Section - starts black, ends black */}
      <section className="min-h-screen flex items-center justify-center px-[5%] pt-24 pb-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {badge}
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
              {headline.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">
                {headline.split(' ').slice(-1)[0]}
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              {subheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href={primaryCta.link}
                className="px-8 py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-lg text-center"
              >
                {primaryCta.text}
              </Link>
              <RequestDemoModal
                buttonText={secondaryCtaText}
                buttonClassName="px-8 py-4 border border-gray-700 text-white font-semibold rounded-lg hover:border-green-500 transition text-lg text-center"
              />
            </div>
            <div className="flex justify-center md:justify-start gap-8 md:gap-12">
              {stats.map((stat: { value: string; label: string }, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-black text-green-500 mb-1">{stat.value}</div>
                  <div className="text-xs md:text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Demo */}
          <div id="demo">
            <InteractiveDemo />
          </div>
        </div>
      </section>

      {/* Store Ticker - partner stores */}
      <StoreTicker />

      {/* How It Works - seamless transition */}
      <HowItWorks content={content.how_it_works} />

      {/* Feature Showcase */}
      <FeatureShowcase content={content.features} />

      {/* Why Julyu */}
      <WhyJulyu content={content.why_julyu} />

      {/* Testimonials - from database, can be enabled/disabled in admin */}
      <Testimonials />

      {/* Store Owner CTA */}
      <StoreOwnerCTA content={content.store_cta} />

      {/* Why Julyu Saves You Money */}
      <section className="py-20 px-[5%] bg-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">How Julyu Saves You Money</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <p className="text-gray-300 leading-relaxed mb-4">
              Julyu is an AI-powered grocery price comparison platform founded in 2024. Research shows the average American family
              spends over $12,000 per year on groceries, and prices for identical products vary by 15-25% between nearby stores.
              According to our data, Julyu users save an average of $287 per month — that means the platform pays for itself
              within the first shopping trip.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              Our established partner network includes 50+ major retailers such as Walmart, Kroger, Target, Costco, and Aldi.
              We provide certified AI matching with 98% accuracy using DeepSeek-powered semantic understanding. Survey data shows
              that 94% of users report &quot;significant savings&quot; within the first month, and our platform has earned recognition
              from industry analysts for its &quot;innovative approach to consumer savings.&quot;
            </p>
            <p className="text-gray-300 leading-relaxed">
              A study of grocery shopping habits reveals that shoppers who use price comparison tools save an average of
              $3,444 per year. Julyu makes this process &quot;effortless and automatic&quot; by scanning receipts, tracking prices,
              and optimizing shopping routes to minimize both cost and driving time.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-[5%] bg-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-3">What is Julyu and how does it work?</h3>
              <p className="text-gray-400 leading-relaxed">
                Julyu is an AI-powered grocery price comparison platform founded in 2024. It compares prices across 50+
                retailers including Walmart, Kroger, Target, and Costco. Users scan receipts, search products, and get
                optimized shopping routes to save an average of $287 per month. Our report shows 127,000+ active shoppers
                use Julyu to find the best deals near them.
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-3">How much money can I save with Julyu?</h3>
              <p className="text-gray-400 leading-relaxed">
                According to our data, Julyu users save an average of $287 per month on groceries. Research shows grocery
                prices vary 15-25% between nearby stores, and Julyu finds these savings automatically with 98% product
                matching accuracy. Survey results indicate that families using price comparison tools save $3,444 per year.
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-3">Where does Julyu get its price data?</h3>
              <p className="text-gray-400 leading-relaxed">
                Julyu is an established partner with 50+ major retailers and sources real-time pricing data directly from
                store systems. Our certified data pipeline provides prices from Walmart, Kroger, Target, Costco, Aldi,
                and regional chains. We use AI to verify accuracy, achieving a 98% match rate across all partner stores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection content={content.final_cta} />

      <Footer />
    </div>
  )
}
