import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { getPageContent } from '@/lib/content/getPageContent'

// Default content - used if no database content exists
const defaultContent = {
  headline: 'About Julyu',
  subheadline: 'The Bloomberg Terminal for Grocery Consumers',
  about_text: 'Julyu is an AI-powered grocery price comparison platform that helps consumers save money by comparing prices across 50+ retailers. Our mission is to make grocery shopping more transparent and affordable for everyone.',
}

export default async function AboutPage() {
  // Try to fetch dynamic content from database
  const pageContent = await getPageContent('about')

  // Use database content if available, otherwise use defaults
  const headline = pageContent?.headline || defaultContent.headline
  const subheadline = pageContent?.subheadline || defaultContent.subheadline
  const aboutText = pageContent?.content?.about_text || defaultContent.about_text

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-green-900/40 text-white flex flex-col">
      <Header />

      <div className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-4xl mx-auto">
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
                We use advanced AI technology to scan receipts, track prices, and find the best deals
                at stores near you. Our users save an average of $287 per month on groceries.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• AI-powered receipt scanning and price extraction</li>
                <li>• Real-time price comparison across 50+ retailers</li>
                <li>• Smart shopping list optimization</li>
                <li>• Price drop alerts and savings analytics</li>
              </ul>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Join Us</h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                Join over 127,000 smart shoppers who are already saving money with Julyu.
              </p>
              <Link
                href="/auth/signup"
                className="inline-block px-8 py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
