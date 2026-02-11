import type { Metadata } from 'next'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import ContactForm from '@/components/contact/ContactForm'

export const dynamic = 'force-dynamic'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'

export const metadata: Metadata = {
  title: 'Contact Julyu - Get Help & Support',
  description:
    'Get in touch with the Julyu team for support, questions, or feedback about our AI-powered grocery price comparison platform. We typically respond within 24 hours.',
  openGraph: {
    title: 'Contact Julyu - Get Help & Support',
    description:
      'Reach out to the Julyu team. We\'re here to help with any questions about our grocery price comparison platform.',
    url: `${baseUrl}/contact`,
  },
  alternates: {
    canonical: `${baseUrl}/contact`,
  },
}

const contactJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact Julyu',
  description: 'Get in touch with the Julyu team for support, questions, or feedback.',
  url: `${baseUrl}/contact`,
  mainEntity: {
    '@type': 'Organization',
    name: 'Julyu',
    url: baseUrl,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@julyu.com',
      availableLanguage: 'English',
    },
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/30 to-black text-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
      <Header />

      <div className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-black mb-6">
              Get In <span className="text-green-500">Touch</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Have a question or feedback? Fill out the form below and we&apos;ll get back to you within 24 hours.
            </p>
          </div>

          {/* Contact Form */}
          <ContactForm />

          {/* Additional Contact Info */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 text-sm">
              You can also reach us directly at{' '}
              <a href="mailto:support@julyu.com" className="text-green-500 hover:text-green-400 transition">
                support@julyu.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
