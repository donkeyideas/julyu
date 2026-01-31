import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import InteractiveDemo from '@/components/home/InteractiveDemo'
import HowItWorks from '@/components/home/HowItWorks'
import FeatureShowcase from '@/components/home/FeatureShowcase'
import WhyJulyu from '@/components/home/WhyJulyu'
import Testimonials from '@/components/home/Testimonials'
import StoreOwnerCTA from '@/components/home/StoreOwnerCTA'
import CTASection from '@/components/home/CTASection'
import { getPageWithSections } from '@/lib/content/getPageContent'

export default async function HomePage() {
  // Fetch content from database
  const { content } = await getPageWithSections('home')

  // Extract hero content with defaults
  const hero = content.hero || {}
  const badge = hero.badge || 'Now in Early Access'
  const headline = hero.headline || 'Stop Overpaying for Groceries'
  const subheadline = hero.subheadline || 'Compare prices across Kroger, Walmart, and more in seconds. Scan receipts, track spending, and discover savings with smart technology.'
  const primaryCta = hero.primary_cta || { text: 'Get Early Access', link: '/auth/signup' }
  const secondaryCta = hero.secondary_cta || { text: 'Try Demo', link: '#demo' }
  const stats = hero.stats || [
    { value: 'Real-Time', label: 'Price Data' },
    { value: 'Smart', label: 'Technology' },
    { value: 'Free', label: 'To Start' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-950/30 to-black text-white">
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
              <Link
                href={secondaryCta.link}
                className="px-8 py-4 border border-gray-700 text-white font-semibold rounded-lg hover:border-green-500 transition text-lg text-center"
              >
                {secondaryCta.text}
              </Link>
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

      {/* CTA Section */}
      <CTASection content={content.final_cta} />

      <Footer />
    </div>
  )
}
