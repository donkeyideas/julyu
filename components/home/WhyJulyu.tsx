'use client'

interface WhyJulyuContent {
  title?: string
  subtitle?: string
  problem_stats?: {
    stat: string
    label: string
  }[]
  benefits?: {
    icon?: string
    title: string
    description: string
  }[]
  trust_indicators?: {
    icon?: string
    label: string
  }[]
}

interface WhyJulyuProps {
  content?: WhyJulyuContent
}

const defaultBenefits = [
  {
    icon: 'chart',
    title: 'Compare Instantly',
    description: 'See prices from multiple stores side-by-side. No more driving around or flipping through apps.',
  },
  {
    icon: 'camera',
    title: 'Scan Any Receipt',
    description: 'Smart technology reads your receipts in seconds. Automatically tracks your spending and finds where you could save.',
  },
  {
    icon: 'lightning',
    title: 'Smart Insights',
    description: 'Intelligent recommendations based on your shopping habits. Find deals you actually care about.',
  },
  {
    icon: 'dollar',
    title: 'Free to Use',
    description: 'Core features are free forever. No hidden fees, no credit card required to get started.',
  },
]

const defaultProblemStats = [
  { stat: '$2,000+', label: 'Average yearly overspend on groceries per household' },
  { stat: '15-25%', label: 'Price variance on identical items across stores' },
  { stat: '2-3 hrs', label: 'Time wasted comparing prices manually each week' },
]

const defaultTrustIndicators = [
  { icon: 'check', label: 'SSL Secured' },
  { icon: 'shield', label: 'Privacy Protected' },
  { icon: 'lightning', label: 'Smart Technology' },
]

const benefitIcons: Record<string, JSX.Element> = {
  chart: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  camera: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  lightning: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  dollar: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const trustIcons: Record<string, JSX.Element> = {
  check: (
    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  lightning: (
    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
}

export default function WhyJulyu({ content }: WhyJulyuProps) {
  const title = content?.title || 'Why Julyu?'
  const subtitle = content?.subtitle || "Grocery shopping shouldn't feel like a guessing game. We built Julyu to give everyone access to the pricing intelligence that used to be reserved for big retailers."
  const problemStats = content?.problem_stats || defaultProblemStats
  const benefits = content?.benefits || defaultBenefits
  const trustIndicators = content?.trust_indicators || defaultTrustIndicators

  return (
    <section className="py-24 px-[5%] bg-gradient-to-b from-green-950/40 to-green-950/60">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
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

        {/* Problem Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {problemStats.map((item, index) => (
            <div
              key={index}
              className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center"
            >
              <div className="text-3xl md:text-4xl font-black text-red-400 mb-2">
                {item.stat}
              </div>
              <div className="text-sm text-gray-400">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-green-500/50 transition-colors"
            >
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-4">
                {benefitIcons[benefit.icon || 'chart'] || benefitIcons.chart}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
              <p className="text-gray-400">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          {trustIndicators.map((indicator, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-500">
              {trustIcons[indicator.icon || 'check'] || trustIcons.check}
              <span>{indicator.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
