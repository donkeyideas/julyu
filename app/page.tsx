import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import InteractiveDemo from '@/components/home/InteractiveDemo'
import HowItWorks from '@/components/home/HowItWorks'
import FeatureShowcase from '@/components/home/FeatureShowcase'
import WhyJulyu from '@/components/home/WhyJulyu'
import StoreOwnerCTA from '@/components/home/StoreOwnerCTA'
import CTASection from '@/components/home/CTASection'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-950/30 to-black text-white">
      <Header transparent />

      {/* Hero Section - starts black, ends black */}
      <section className="min-h-screen flex items-center justify-center px-[5%] pt-24 pb-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Now in Early Access
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
              Stop Overpaying for <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Groceries</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              Compare prices across Kroger, Walmart, and more in seconds. Scan receipts, track spending, and discover savings with AI-powered intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/auth/signup"
                className="px-8 py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-lg text-center"
              >
                Get Early Access
              </Link>
              <Link
                href="#demo"
                className="px-8 py-4 border border-gray-700 text-white font-semibold rounded-lg hover:border-green-500 transition text-lg text-center"
              >
                Try Demo
              </Link>
            </div>
            <div className="flex justify-center md:justify-start gap-8 md:gap-12">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-green-500 mb-1">Real-Time</div>
                <div className="text-xs md:text-sm text-gray-500">Price Data</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-green-500 mb-1">AI</div>
                <div className="text-xs md:text-sm text-gray-500">Powered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-green-500 mb-1">Free</div>
                <div className="text-xs md:text-sm text-gray-500">To Start</div>
              </div>
            </div>
          </div>

          {/* Interactive Demo */}
          <div id="demo">
            <InteractiveDemo />
          </div>
        </div>
      </section>

      {/* How It Works - seamless transition */}
      <HowItWorks />

      {/* Feature Showcase */}
      <FeatureShowcase />

      {/* Why Julyu - replaces fake testimonials */}
      <WhyJulyu />

      {/* Store Owner CTA */}
      <StoreOwnerCTA />

      {/* CTA Section */}
      <CTASection />

      <Footer />
    </div>
  )
}
