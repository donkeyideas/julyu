import Link from 'next/link'

interface Feature {
  icon?: string
  title: string
  description: string
}

interface FeatureShowcaseContent {
  title?: string
  subtitle?: string
  features?: Feature[]
}

interface FeatureShowcaseProps {
  content?: FeatureShowcaseContent
}

const defaultFeatures = [
  {
    title: 'Receipt Scanning',
    description: 'Smart OCR technology extracts every item from your receipts in seconds. No manual entry needed.',
    color: 'green',
  },
  {
    title: 'Price Alerts',
    description: 'Set alerts for your favorite products and get notified instantly when prices drop.',
    color: 'blue',
  },
  {
    title: 'Smart Lists',
    description: 'Create shopping lists that automatically show the best prices at nearby stores.',
    color: 'purple',
  },
  {
    title: 'Price Comparison',
    description: 'Compare prices across local stores, supermarkets, and bodegas to find the best deals.',
    color: 'orange',
  },
  {
    title: 'Savings Analytics',
    description: 'Track your monthly savings with detailed analytics and see your progress over time.',
    color: 'pink',
  },
  {
    title: 'Store Finder',
    description: 'Find the nearest stores with the best prices based on your shopping list.',
    color: 'cyan',
  },
]

const featureIcons = [
  <svg key="1" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
  <svg key="2" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>,
  <svg key="3" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>,
  <svg key="4" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>,
  <svg key="5" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>,
  <svg key="6" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
]

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'hover:border-green-500/50' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'hover:border-blue-500/50' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'hover:border-purple-500/50' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'hover:border-orange-500/50' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'hover:border-pink-500/50' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'hover:border-cyan-500/50' },
}

const colorOrder = ['green', 'blue', 'purple', 'orange', 'pink', 'cyan']

export default function FeatureShowcase({ content }: FeatureShowcaseProps) {
  const title = content?.title || 'Powerful Features'
  const subtitle = content?.subtitle || 'Everything you need to take control of your grocery spending.'
  const features = content?.features || defaultFeatures

  return (
    <section className="py-24 px-[5%] bg-gradient-to-b from-green-950/20 to-green-950/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            {title.includes(' ') ? (
              <>
                {title.split(' ').slice(0, -1).join(' ')}{' '}
                <span className="text-green-500">{title.split(' ').slice(-1)[0]}</span>
              </>
            ) : (
              <span className="text-green-500">{title}</span>
            )}
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const colorKey = colorOrder[index % colorOrder.length]
            const colors = colorClasses[colorKey]
            return (
              <div
                key={index}
                className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${colors.border}`}
              >
                <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} mb-5`}>
                  {featureIcons[index % featureIcons.length]}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 text-green-500 hover:text-green-400 transition font-semibold"
          >
            View all features
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
