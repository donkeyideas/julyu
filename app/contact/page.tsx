import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { getPageWithSections } from '@/lib/content/getPageContent'

// Default content - used if no database content exists
const defaultContent = {
  hero: {
    headline: 'Contact Us',
    subheadline: 'Get in touch with the Julyu team'
  },
  contact_info: {
    email: 'contact@julyu.com',
    response_time: 'We typically respond within 24 hours'
  },
  support_options: {
    options: [
      { icon: 'email', title: 'Email Support', description: 'Send us an email and we\'ll get back to you within 24 hours.', action: 'support@julyu.com' },
      { icon: 'chat', title: 'Live Chat', description: 'Chat with our team in real-time during business hours.', action: 'Start Chat' },
      { icon: 'book', title: 'Help Center', description: 'Browse our knowledge base for answers to common questions.', action: '/help' }
    ]
  }
}

const supportIcons: Record<string, JSX.Element> = {
  email: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  chat: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  book: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  help: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export default async function ContactPage() {
  // Try to fetch dynamic content from database
  const { content: pageContent } = await getPageWithSections('contact')

  // Use database content if available, otherwise use defaults
  const hero = pageContent?.hero || defaultContent.hero
  const contactInfo = pageContent?.contact_info || defaultContent.contact_info
  const supportOptions = pageContent?.support_options || defaultContent.support_options

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/30 to-black text-white flex flex-col">
      <Header />

      <div className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              {hero.headline?.includes(' ') ? (
                <>
                  {hero.headline.split(' ').slice(0, -1).join(' ')}{' '}
                  <span className="text-green-500">{hero.headline.split(' ').slice(-1)[0]}</span>
                </>
              ) : (
                <span className="text-green-500">{hero.headline}</span>
              )}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">{hero.subheadline}</p>
          </div>

          {/* Contact Info Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-2xl mx-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center hover:border-green-500/50 transition">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-1">Email</h3>
              <a href={`mailto:${contactInfo.email}`} className="text-green-500 hover:text-green-400 transition text-sm">
                {contactInfo.email}
              </a>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center hover:border-green-500/50 transition">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-1">Response Time</h3>
              <p className="text-gray-400 text-sm">{contactInfo.response_time}</p>
            </div>
          </div>

          {/* Support Options */}
          {supportOptions.options && supportOptions.options.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-black text-center mb-8">
                How Can We <span className="text-green-500">Help?</span>
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {supportOptions.options.map((option: any, index: number) => (
                  <div key={index} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-green-500/50 transition">
                    <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-4">
                      {supportIcons[option.icon] || supportIcons.help}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{option.title}</h3>
                    <p className="text-gray-400 mb-4">{option.description}</p>
                    {option.action && (
                      option.action.includes('@') ? (
                        <a href={`mailto:${option.action}`} className="text-green-500 hover:text-green-400 transition font-medium">
                          {option.action}
                        </a>
                      ) : option.action.startsWith('/') ? (
                        <a href={option.action} className="text-green-500 hover:text-green-400 transition font-medium">
                          Browse Articles →
                        </a>
                      ) : (
                        <button className="text-green-500 hover:text-green-400 transition font-medium">
                          {option.action}
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Contact CTA */}
          <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-3xl p-12 border border-green-500/30 text-center">
            <h2 className="text-3xl font-black text-white mb-4">Ready to Get Started?</h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
              Have questions about Julyu? We&apos;re here to help you save money on groceries.
            </p>
            <a
              href={`mailto:${contactInfo.email}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-lg"
            >
              Send us an Email
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
