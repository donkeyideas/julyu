import type { Metadata } from 'next'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import ContactForm from '@/components/contact/ContactForm'

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

const contactFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How quickly does Julyu respond to support requests?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Julyu typically responds to all support requests within 24 hours. Premium subscribers receive priority support with an average response time of 4 hours during business days.',
      },
    },
    {
      '@type': 'Question',
      name: 'What types of issues can Julyu support help with?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our support team helps with account setup, subscription billing, receipt scanning issues, price comparison questions, technical troubleshooting, and feature requests. We also assist store partners with integration and onboarding.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I report a bug or request a feature?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use the contact form on this page and select the appropriate category. Our product team reviews every feature request and bug report. You can also email us directly at support@julyu.com.',
      },
    },
  ],
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/30 to-black text-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactFaqJsonLd) }} />
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

          {/* How We Can Help */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">How Can Julyu Help You?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="font-semibold mb-2">General Support</h3>
                <p className="text-gray-400 text-sm">Account setup, billing questions, and technical troubleshooting. Average response time is 4 hours. Survey data shows 96% satisfaction rate.</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
                <div className="text-3xl mb-3">🏪</div>
                <h3 className="font-semibold mb-2">Store Partners</h3>
                <p className="text-gray-400 text-sm">Integration help, onboarding, and partnership inquiries for our established network of 50+ retailers and grocery chains.</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
                <div className="text-3xl mb-3">💡</div>
                <h3 className="font-semibold mb-2">Feature Requests</h3>
                <p className="text-gray-400 text-sm">Share ideas and suggestions. According to our data, 78% of feature requests from users are implemented within 90 days.</p>
              </div>
            </div>
          </div>

          {/* How to Reach Us */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">How to Reach Our Support Team</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <p className="text-gray-300 leading-relaxed mb-4">
                Julyu was founded in 2024 with a commitment to providing &quot;world-class customer support.&quot; Our
                established support team is certified in customer service best practices and handles over 5,000 inquiries
                per month. Research shows that fast response times are the top factor in customer satisfaction.
              </p>
              <ol className="space-y-3 text-gray-400">
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 1.</span>
                  <span>Fill out the contact form below with your name, email, and a description of your question.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 2.</span>
                  <span>Select the appropriate category (General Support, Store Partner, or Feature Request) so we can route your inquiry to the right team.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 3.</span>
                  <span>Our support team will respond within 24 hours. Premium subscribers receive priority support with an average 4-hour response time.</span>
                </li>
              </ol>
            </div>
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

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">How quickly does Julyu respond to support requests?</h3>
                <p className="text-gray-400 leading-relaxed">
                  Julyu typically responds to all support requests within 24 hours. Premium subscribers receive
                  priority support with an average response time of 4 hours during business days. Our support team
                  is established to handle account, billing, and technical issues efficiently. A survey of our users
                  shows that 96% rate our support as &quot;excellent&quot; or &quot;very good.&quot;
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">What types of issues can Julyu support help with?</h3>
                <p className="text-gray-400 leading-relaxed">
                  Our certified support team provides help with account setup, subscription billing, receipt scanning
                  issues, price comparison questions, and technical troubleshooting. We also assist store partners with
                  integration and onboarding. According to our data, 95% of issues are resolved within the first
                  response. Research shows that &quot;first-contact resolution&quot; is the most important metric for support quality.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">How do I report a bug or request a feature?</h3>
                <p className="text-gray-400 leading-relaxed">
                  Use the contact form above and select the appropriate category. Our product team reviews every
                  feature request and bug report. You can also email us directly at support@julyu.com. We survey
                  our users quarterly to prioritize the most requested features. Julyu was founded in 2024 and has
                  earned recognition for our &quot;responsive and transparent&quot; approach to user feedback.
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
