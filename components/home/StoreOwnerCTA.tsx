import Link from 'next/link'

interface StoreOwnerCTAContent {
  headline?: string
  subheadline?: string
  cta?: {
    text: string
    link: string
  }
}

interface StoreOwnerCTAProps {
  content?: StoreOwnerCTAContent
}

export default function StoreOwnerCTA({ content }: StoreOwnerCTAProps) {
  const headline = content?.headline || 'Bring Your Store Online'
  const subheadline = content?.subheadline || 'Own a bodega, corner store, or small grocery? Join Julyu and start receiving orders from customers in your neighborhood. No tech experience needed.'
  const ctaText = content?.cta?.text || 'Apply Now'
  const ctaLink = content?.cta?.link || '/for-stores/apply'

  return (
    <section className="py-24 px-[5%] bg-green-950/60">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              For Store Owners
            </div>

            <h2 className="text-4xl md:text-5xl font-black mb-6">
              {headline.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">
                {headline.split(' ').slice(-1)[0]}
              </span>
            </h2>

            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              {subheadline}
            </p>

            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-white">Easy Inventory Management</div>
                  <div className="text-gray-400 text-sm">Upload receipts or connect your POS system - we handle the rest</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-white">Integrated Delivery</div>
                  <div className="text-gray-400 text-sm">DoorDash handles delivery - you focus on preparing orders</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mt-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-white">Flexible Pricing</div>
                  <div className="text-gray-400 text-sm">Competitive commission rates with weekly payouts</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={ctaLink}
                className="px-8 py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-lg text-center"
              >
                {ctaText}
              </Link>
              <Link
                href="/for-stores"
                className="px-8 py-4 border border-gray-700 text-white font-semibold rounded-lg hover:border-green-500 transition text-lg text-center"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Right Content - Stats/Benefits */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-green-500/50 transition-colors">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Reach New Customers</h3>
              <p className="text-gray-400">
                Get discovered by customers searching for products near them. We bring the traffic, you make the sales.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-green-500/50 transition-colors">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Increase Revenue</h3>
              <p className="text-gray-400">
                Add a new revenue stream without hiring staff or changing how you run your store today.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-green-500/50 transition-colors">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Simple Setup</h3>
              <p className="text-gray-400">
                Quick application process. Once approved, you can start receiving orders the same day.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
