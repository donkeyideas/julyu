import Link from 'next/link'

interface CTASectionContent {
  headline?: string
  subheadline?: string
  primary_cta?: {
    text: string
    link: string
  }
  secondary_cta?: {
    text: string
    link: string
  }
}

interface CTASectionProps {
  content?: CTASectionContent
}

export default function CTASection({ content }: CTASectionProps) {
  const headline = content?.headline || 'Ready to Save?'
  const subheadline = content?.subheadline || 'Join Julyu today and take control of your grocery spending. Compare prices, track receipts, and discover savings with AI.'
  const primaryCta = content?.primary_cta || { text: 'Get Started Free', link: '/auth/signup' }
  const secondaryCta = content?.secondary_cta || { text: 'See Pricing', link: '/pricing' }

  return (
    <section className="py-24 px-[5%] bg-gradient-to-b from-green-950/60 to-black">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-3xl p-12 md:p-16 border border-green-500/30 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-green-500 rounded-full filter blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-green-500 rounded-full filter blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              {headline}
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {subheadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={primaryCta.link}
                className="px-8 py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-lg inline-flex items-center justify-center gap-2"
              >
                {primaryCta.text}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href={secondaryCta.link}
                className="px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition text-lg border border-white/20"
              >
                {secondaryCta.text}
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-400">
              No credit card required. Free tier available forever.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
