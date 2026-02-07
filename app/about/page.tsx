import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { getPageContent } from '@/lib/content/getPageContent'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'

export const metadata: Metadata = {
  title: 'About Julyu - Our Mission to Save You Money on Groceries',
  description:
    'Julyu is an AI-powered grocery price comparison platform helping 127,000+ shoppers save an average of $287/month. Learn about our mission to make grocery shopping smarter.',
  openGraph: {
    title: 'About Julyu - Our Mission to Save You Money',
    description:
      'Learn how Julyu uses AI to compare grocery prices across 50+ retailers and help families save thousands each year.',
    url: `${baseUrl}/about`,
  },
  alternates: {
    canonical: `${baseUrl}/about`,
  },
}

// Default content - used if no database content exists
const defaultContent = {
  headline: 'About Julyu',
  subheadline: 'Making Grocery Shopping Smarter',
  about_text: 'Julyu is an AI-powered grocery price comparison platform designed to help you save money and shop smarter. We believe everyone deserves access to transparent pricing information.',
}

export default async function AboutPage() {
  // Try to fetch dynamic content from database
  const pageContent = await getPageContent('about')

  // Use database content if available, otherwise use defaults
  const headline = pageContent?.headline || defaultContent.headline
  const subheadline = pageContent?.subheadline || defaultContent.subheadline
  const aboutText = pageContent?.content?.about_text || defaultContent.about_text

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/30 to-black text-white flex flex-col">
      <Header />

      <div className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Early Access
          </div>
          <h1 className="text-5xl font-black mb-6">{headline}</h1>
          <p className="text-xl text-gray-400 mb-12">{subheadline}</p>

          <div className="space-y-8">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Our Mission</h2>
              <p className="text-gray-300 leading-relaxed">
                {aboutText}
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">What We Do</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use AI technology to scan receipts, track prices, and help you find the best deals
                at stores near you. Our goal is to make grocery shopping transparent and help you keep more money in your pocket.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>AI-powered receipt scanning and price extraction</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time price comparison across major retailers</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Smart shopping list optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Price drop alerts and spending analytics</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Why We Built This</h2>
              <p className="text-gray-300 leading-relaxed">
                Grocery prices vary significantly between stores—often 15-25% for the exact same items.
                We built Julyu because we believe you shouldn&apos;t have to spend hours comparing prices
                or second-guessing your shopping choices. With AI doing the heavy lifting, you can make
                informed decisions in seconds.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Get Early Access</h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                Julyu is currently in early access. Sign up today to be among the first to experience
                smarter grocery shopping and help shape the future of the platform.
              </p>
              <Link
                href="/auth/signup"
                className="inline-block px-8 py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
              >
                Join Early Access
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
