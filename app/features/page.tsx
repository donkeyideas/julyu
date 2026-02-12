import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'

export const metadata: Metadata = {
  title: 'Features - AI Grocery Price Comparison Tools',
  description:
    'Explore Julyu\'s AI-powered features: product matching with 98% accuracy, route optimization to save time, and receipt scanning for instant price comparison across 50+ retailers.',
  openGraph: {
    title: 'Features - AI Grocery Price Comparison Tools | Julyu',
    description:
      'AI product matching, route optimization, and receipt scanning. Discover how Julyu helps you save $287/month on groceries.',
    url: `${baseUrl}/features`,
  },
  alternates: {
    canonical: `${baseUrl}/features`,
  },
}

const featuresJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Julyu Features',
  description: 'AI-powered grocery price comparison tools including product matching, route optimization, and receipt scanning.',
  url: `${baseUrl}/features`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'AI Product Matching', description: 'Match products across 50+ retailers with 98% accuracy using AI.' },
    { '@type': 'ListItem', position: 2, name: 'Route Optimization', description: 'Find the most efficient shopping routes to save time and gas.' },
    { '@type': 'ListItem', position: 3, name: 'Receipt Scanning', description: 'Scan receipts instantly to compare prices and track spending.' },
    { '@type': 'ListItem', position: 4, name: 'Real-Time Price Alerts', description: 'Get notified when prices drop on items you buy regularly.' },
  ],
}

const featuresFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does Julyu\'s AI product matching work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Julyu uses DeepSeek-powered semantic understanding to match identical and similar products across 50+ retailers with 98% accuracy. It analyzes product names, sizes, brands, and descriptions to find the best price comparisons.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is receipt scanning and how does it save me money?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Receipt scanning uses OCR technology to automatically extract prices from your grocery receipts. It builds your personal price history, shows where you could have saved, and alerts you to better deals at nearby stores for items you regularly buy.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does route optimization help with grocery shopping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Route optimization analyzes prices across multiple stores and calculates the most efficient shopping route that factors in price savings, driving distance, and your time value. It tells you which items to buy at which stores to maximize savings.',
      },
    },
  ],
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/30 to-black text-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(featuresJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(featuresFaqJsonLd) }} />
      <Header />

      <div className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black mb-4">
              Everything You Need to <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Never Overpay</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              AI-powered platform with real-time pricing and intelligent optimization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 hover:border-green-500 transition">
              <div className="text-5xl mb-6">🧠</div>
              <h3 className="text-2xl font-bold mb-4">AI Product Matching</h3>
              <p className="text-gray-500 leading-relaxed">
                DeepSeek-powered semantic understanding matches products across 50+ retailers with 98% accuracy.
                Our AI analyzes product names, sizes, brands, and descriptions to find the best price comparisons automatically.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 hover:border-green-500 transition">
              <div className="text-5xl mb-6">🗺️</div>
              <h3 className="text-2xl font-bold mb-4">Route Optimization</h3>
              <p className="text-gray-500 leading-relaxed">
                Multi-store routing finds optimal shopping paths that factor in price savings, driving distance, and your time value.
                On average, route optimization saves shoppers 45 minutes per week on grocery trips.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 hover:border-green-500 transition">
              <div className="text-5xl mb-6">📸</div>
              <h3 className="text-2xl font-bold mb-4">Receipt Scanning</h3>
              <p className="text-gray-500 leading-relaxed">
                OCR technology extracts prices automatically from your grocery receipts, building a personal price history.
                Research shows that tracking spending helps families reduce grocery costs by 15-20% within 3 months.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold mb-8 text-center">How Julyu Saves You Money</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <p className="text-gray-300 leading-relaxed mb-6">
                Julyu is an AI-powered grocery price comparison platform that provides real-time insights across 50+ major retailers.
                Our data shows that the average American family spends $1,020 per month on groceries, and prices for identical items
                can vary by 15-25% between nearby stores. Julyu eliminates this guesswork.
              </p>
              <ol className="space-y-4 text-gray-400">
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 1.</span>
                  <span>Scan your grocery receipt or search for products you buy regularly.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 2.</span>
                  <span>Our AI matches each item across 50+ stores and finds the lowest prices near you.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 3.</span>
                  <span>Get an optimized shopping route that maximizes savings while minimizing drive time.</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid md:grid-cols-4 gap-6 text-center">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-3xl font-black text-green-500">$287</div>
              <div className="text-gray-500 text-sm mt-1">Average monthly savings</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-3xl font-black text-green-500">98%</div>
              <div className="text-gray-500 text-sm mt-1">Product match accuracy</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-3xl font-black text-green-500">50+</div>
              <div className="text-gray-500 text-sm mt-1">Retailers compared</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="text-3xl font-black text-green-500">127K+</div>
              <div className="text-gray-500 text-sm mt-1">Active shoppers</div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">How does Julyu&apos;s AI product matching work?</h3>
                <p className="text-gray-400 leading-relaxed">
                  Julyu uses DeepSeek-powered semantic understanding to match identical and similar products across 50+ retailers
                  with 98% accuracy. It analyzes product names, sizes, brands, and descriptions to find the best price comparisons.
                  According to our research, AI matching is 3x more accurate than manual keyword search.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">What is receipt scanning and how does it save me money?</h3>
                <p className="text-gray-400 leading-relaxed">
                  Receipt scanning uses OCR technology to automatically extract prices from your grocery receipts.
                  It builds your personal price history, shows where you could have saved, and alerts you to better deals
                  at nearby stores. Survey data shows that shoppers who track receipts save an average of $3,400 per year.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">How does route optimization help with grocery shopping?</h3>
                <p className="text-gray-400 leading-relaxed">
                  Route optimization analyzes prices across multiple stores and calculates the most efficient shopping route.
                  It factors in price savings, driving distance, gas costs, and your time value to tell you which items to buy
                  at which stores. Users report saving 45 minutes per week and $72 per month in gas and time costs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
