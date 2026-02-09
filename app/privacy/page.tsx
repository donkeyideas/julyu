import type { Metadata } from 'next'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { getPageContent } from '@/lib/content/getPageContent'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'

export const metadata: Metadata = {
  title: 'Privacy Policy - How Julyu Protects Your Data',
  description:
    'Julyu\'s Privacy Policy explains how we collect, use, and protect your personal information when you use our grocery price comparison platform.',
  openGraph: {
    title: 'Privacy Policy | Julyu',
    description:
      'Learn how Julyu protects your privacy and handles your data.',
    url: `${baseUrl}/privacy`,
  },
  alternates: {
    canonical: `${baseUrl}/privacy`,
  },
}

// Revalidate every 24 hours - privacy page content rarely changes
export const revalidate = 86400

// Default content
const defaultContent = {
  headline: 'Privacy Policy',
  last_updated: 'January 26, 2025',
  contact_email: 'privacy@julyu.com',
  introduction: 'Julyu ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our grocery price comparison platform and services.',
  info_collect_account: 'When you create an account, we collect your email address, name, and password. If you sign in with Google, we receive your name, email, and profile picture from Google.',
  info_collect_receipt: 'When you scan receipts, we process the images to extract item names, prices, store information, and purchase dates. This data is used to provide price comparisons and savings insights.',
  info_collect_lists: 'We store the shopping lists you create, including item names and quantities, to provide price comparison features.',
  info_collect_location: 'With your permission, we may collect your zip code or general location to show relevant store prices in your area. We do not track your precise GPS location.',
  info_collect_usage: 'We collect information about how you use our service, including pages visited, features used, and interactions with the platform.',
  how_we_use_intro: 'We use your information to:',
  how_we_use_1: 'Provide and improve our price comparison services',
  how_we_use_2: 'Process and analyze your receipts for savings insights',
  how_we_use_3: 'Send you price alerts and notifications you\'ve requested',
  how_we_use_4: 'Communicate with you about your account and our services',
  how_we_use_5: 'Analyze usage patterns to improve the platform',
  data_sharing_intro: 'We do not sell your personal information. We may share your information only in the following circumstances:',
  data_sharing_providers: 'We use third-party services (hosting, analytics, AI processing) that may process your data on our behalf.',
  data_sharing_legal: 'We may disclose information if required by law or to protect our rights.',
  data_sharing_transfers: 'If Julyu is acquired or merged, your information may be transferred to the new entity.',
  data_security: 'We implement industry-standard security measures to protect your data, including encryption in transit (HTTPS/TLS) and at rest. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.',
  your_rights_intro: 'You have the right to:',
  your_rights_1: 'Access and download your personal data',
  your_rights_2: 'Correct inaccurate information',
  your_rights_3: 'Delete your account and associated data',
  your_rights_4: 'Opt out of marketing communications',
  your_rights_contact_text: 'To exercise these rights, contact us at',
  cookies: 'We use essential cookies to maintain your session and remember your preferences. We may also use analytics cookies to understand how users interact with our platform. You can control cookies through your browser settings.',
  children_privacy: 'Julyu is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.',
  changes_policy: 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.',
  contact_us_text: 'If you have questions about this Privacy Policy, please contact us at:',
}

export default async function PrivacyPage() {
  // Fetch dynamic content from database
  const pageContent = await getPageContent('privacy')
  const c = pageContent?.content || {}

  // Use database content if available, otherwise use defaults
  const headline = pageContent?.headline || defaultContent.headline
  const lastUpdated = c.last_updated || defaultContent.last_updated
  const contactEmail = c.contact_email || defaultContent.contact_email
  const introduction = c.introduction || defaultContent.introduction
  const infoCollectAccount = c.info_collect_account || defaultContent.info_collect_account
  const infoCollectReceipt = c.info_collect_receipt || defaultContent.info_collect_receipt
  const infoCollectLists = c.info_collect_lists || defaultContent.info_collect_lists
  const infoCollectLocation = c.info_collect_location || defaultContent.info_collect_location
  const infoCollectUsage = c.info_collect_usage || defaultContent.info_collect_usage
  const howWeUseIntro = c.how_we_use_intro || defaultContent.how_we_use_intro
  const howWeUse1 = c.how_we_use_1 || defaultContent.how_we_use_1
  const howWeUse2 = c.how_we_use_2 || defaultContent.how_we_use_2
  const howWeUse3 = c.how_we_use_3 || defaultContent.how_we_use_3
  const howWeUse4 = c.how_we_use_4 || defaultContent.how_we_use_4
  const howWeUse5 = c.how_we_use_5 || defaultContent.how_we_use_5
  const dataSharingIntro = c.data_sharing_intro || defaultContent.data_sharing_intro
  const dataSharingProviders = c.data_sharing_providers || defaultContent.data_sharing_providers
  const dataSharingLegal = c.data_sharing_legal || defaultContent.data_sharing_legal
  const dataSharingTransfers = c.data_sharing_transfers || defaultContent.data_sharing_transfers
  const dataSecurity = c.data_security || defaultContent.data_security
  const yourRightsIntro = c.your_rights_intro || defaultContent.your_rights_intro
  const yourRights1 = c.your_rights_1 || defaultContent.your_rights_1
  const yourRights2 = c.your_rights_2 || defaultContent.your_rights_2
  const yourRights3 = c.your_rights_3 || defaultContent.your_rights_3
  const yourRights4 = c.your_rights_4 || defaultContent.your_rights_4
  const yourRightsContactText = c.your_rights_contact_text || defaultContent.your_rights_contact_text
  const cookies = c.cookies || defaultContent.cookies
  const childrenPrivacy = c.children_privacy || defaultContent.children_privacy
  const changesPolicy = c.changes_policy || defaultContent.changes_policy
  const contactUsText = c.contact_us_text || defaultContent.contact_us_text

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/20 to-black text-white flex flex-col">
      <Header />

      <div className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-black mb-4">{headline}</h1>
          <p className="text-gray-400 mb-12">Last updated: {lastUpdated}</p>

          <div className="space-y-8">
            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Introduction</h2>
              <p className="text-gray-300 leading-relaxed">{introduction}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Information We Collect</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="font-semibold text-white mb-2">Account Information</h3>
                  <p className="leading-relaxed">{infoCollectAccount}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Receipt Data</h3>
                  <p className="leading-relaxed">{infoCollectReceipt}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Shopping Lists</h3>
                  <p className="leading-relaxed">{infoCollectLists}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Location Information</h3>
                  <p className="leading-relaxed">{infoCollectLocation}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Usage Data</h3>
                  <p className="leading-relaxed">{infoCollectUsage}</p>
                </div>
              </div>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">How We Use Your Information</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{howWeUse1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{howWeUse2}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{howWeUse3}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{howWeUse4}</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{howWeUse5}</span>
                </li>
              </ul>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Data Sharing</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-white">{dataSharingIntro}</strong>
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span><strong className="text-white">Service Providers:</strong> {dataSharingProviders}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span><strong className="text-white">Legal Requirements:</strong> {dataSharingLegal}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span><strong className="text-white">Business Transfers:</strong> {dataSharingTransfers}</span>
                </li>
              </ul>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Data Security</h2>
              <p className="text-gray-300 leading-relaxed">{dataSecurity}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Your Rights</h2>
              <p className="text-gray-300 leading-relaxed mb-4">{yourRightsIntro}</p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span>{yourRights1}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span>{yourRights2}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span>{yourRights3}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span>{yourRights4}</span>
                </li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                {yourRightsContactText} <a href={`mailto:${contactEmail}`} className="text-green-500 hover:underline">{contactEmail}</a>.
              </p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Cookies</h2>
              <p className="text-gray-300 leading-relaxed">{cookies}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Children&apos;s Privacy</h2>
              <p className="text-gray-300 leading-relaxed">{childrenPrivacy}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Changes to This Policy</h2>
              <p className="text-gray-300 leading-relaxed">{changesPolicy}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Contact Us</h2>
              <p className="text-gray-300 leading-relaxed">
                {contactUsText}
              </p>
              <p className="text-gray-300 mt-4">
                <strong className="text-white">Email:</strong>{' '}
                <a href={`mailto:${contactEmail}`} className="text-green-500 hover:underline">{contactEmail}</a>
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
