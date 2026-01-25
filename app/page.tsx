import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import InteractiveDemo from '@/components/home/InteractiveDemo'
import HowItWorks from '@/components/home/HowItWorks'
import FeatureShowcase from '@/components/home/FeatureShowcase'
import Testimonials from '@/components/home/Testimonials'
import AnimatedStats from '@/components/home/AnimatedStats'
import CTASection from '@/components/home/CTASection'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header transparent />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-[5%] pt-24 pb-16 bg-gradient-to-br from-black via-black to-gray-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
              The <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Bloomberg Terminal</span> for Grocery Consumers
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              AI-powered price intelligence across 50+ retailers. Save $287/month with professional-grade tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/auth/signup"
                className="px-8 py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-lg text-center"
              >
                Start Saving Today
              </Link>
              <Link
                href="#demo"
                className="px-8 py-4 border border-gray-700 text-white font-semibold rounded-lg hover:border-green-500 transition text-lg text-center"
              >
                Try Demo
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-black text-green-500 mb-2">$4.2M</div>
                <div className="text-sm text-gray-500">Total Savings</div>
              </div>
              <div>
                <div className="text-4xl font-black text-green-500 mb-2">127K</div>
                <div className="text-sm text-gray-500">Active Users</div>
              </div>
              <div>
                <div className="text-4xl font-black text-green-500 mb-2">23%</div>
                <div className="text-sm text-gray-500">Avg. Savings</div>
              </div>
            </div>
          </div>

          {/* Interactive Demo */}
          <div id="demo">
            <InteractiveDemo />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Animated Stats */}
      <AnimatedStats />

      {/* Feature Showcase */}
      <FeatureShowcase />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <CTASection />

      <Footer />
    </div>
  )
}
