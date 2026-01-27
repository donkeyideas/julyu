import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { getPageContent } from '@/lib/content/getPageContent'

// Default content
const defaultContent = {
  headline: 'Terms of Service',
  last_updated: 'January 26, 2025',
  contact_email: 'legal@julyu.com',
  agreement: 'By accessing or using Julyu ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service. We reserve the right to update these terms at any time, and your continued use of the Service constitutes acceptance of any changes.',
  user_accounts_intro: 'To access certain features, you must create an account. You agree to:',
  user_accounts_age: 'You must be at least 13 years old to create an account and use the Service.',
  acceptable_use_intro: 'You agree not to use the Service to:',
  price_disclaimer: 'Price information is provided for informational purposes only. While we strive to provide accurate and up-to-date pricing information, we cannot guarantee the accuracy, completeness, or timeliness of price data. Prices may vary by location, change without notice, and may differ from actual in-store prices. Always verify prices at the point of purchase.',
  intellectual_property: 'The Service and its original content, features, and functionality are owned by Julyu and are protected by international copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works based on our Service without our express written permission.',
  user_content: 'You retain ownership of content you upload to the Service (such as receipts and shopping lists). By uploading content, you grant us a non-exclusive, worldwide, royalty-free license to use, process, and analyze this content to provide and improve the Service. You represent that you have the right to upload any content you submit.',
  third_party: 'The Service may contain links to third-party websites or services (such as retailer websites or delivery partners). We are not responsible for the content, privacy policies, or practices of any third-party sites or services. Your interactions with third parties are solely between you and the third party.',
  liability: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, JULYU SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR SAVINGS, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS, IF ANY.',
  warranties: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.',
  termination: 'We may terminate or suspend your account and access to the Service at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason. You may also delete your account at any time through your account settings.',
  governing_law: 'These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved in the courts located in the United States.',
  changes_terms: 'We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes are posted constitutes your acceptance of the modified Terms.',
}

export default async function TermsPage() {
  // Fetch dynamic content from database
  const pageContent = await getPageContent('terms')
  const c = pageContent?.content || {}

  // Use database content if available, otherwise use defaults
  const headline = pageContent?.headline || defaultContent.headline
  const lastUpdated = c.last_updated || defaultContent.last_updated
  const contactEmail = c.contact_email || defaultContent.contact_email
  const agreement = c.agreement || defaultContent.agreement
  const userAccountsIntro = c.user_accounts_intro || defaultContent.user_accounts_intro
  const userAccountsAge = c.user_accounts_age || defaultContent.user_accounts_age
  const acceptableUseIntro = c.acceptable_use_intro || defaultContent.acceptable_use_intro
  const priceDisclaimer = c.price_disclaimer || defaultContent.price_disclaimer
  const intellectualProperty = c.intellectual_property || defaultContent.intellectual_property
  const userContent = c.user_content || defaultContent.user_content
  const thirdParty = c.third_party || defaultContent.third_party
  const liability = c.liability || defaultContent.liability
  const warranties = c.warranties || defaultContent.warranties
  const termination = c.termination || defaultContent.termination
  const governingLaw = c.governing_law || defaultContent.governing_law
  const changesTerms = c.changes_terms || defaultContent.changes_terms

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/20 to-black text-white flex flex-col">
      <Header />

      <div className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-black mb-4">{headline}</h1>
          <p className="text-gray-400 mb-12">Last updated: {lastUpdated}</p>

          <div className="space-y-8">
            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Agreement to Terms</h2>
              <p className="text-gray-300 leading-relaxed">{agreement}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Description of Service</h2>
              <p className="text-gray-300 leading-relaxed">
                Julyu is a grocery price comparison platform that provides:
              </p>
              <ul className="mt-4 space-y-2 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Price comparison across participating grocery retailers</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Receipt scanning and spending analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Shopping list management and optimization</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold">•</span>
                  <span>Price alerts and notifications</span>
                </li>
              </ul>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">User Accounts</h2>
              <div className="space-y-4 text-gray-300">
                <p className="leading-relaxed">{userAccountsIntro}</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Provide accurate and complete information when creating your account</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Maintain the security of your account credentials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Notify us immediately of any unauthorized access to your account</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Be responsible for all activities that occur under your account</span>
                  </li>
                </ul>
                <p className="leading-relaxed">{userAccountsAge}</p>
              </div>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Acceptable Use</h2>
              <p className="text-gray-300 leading-relaxed mb-4">{acceptableUseIntro}</p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Violate any applicable laws or regulations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Infringe on the rights of others</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Attempt to gain unauthorized access to our systems</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Use automated scripts or bots to access the Service</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Scrape or harvest data from the Service for commercial purposes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">✕</span>
                  <span>Upload malicious content or interfere with the Service&apos;s operation</span>
                </li>
              </ul>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Price Information Disclaimer</h2>
              <p className="text-gray-300 leading-relaxed">
                <strong className="text-white">Price information is provided for informational purposes only.</strong>{' '}
                {priceDisclaimer}
              </p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Intellectual Property</h2>
              <p className="text-gray-300 leading-relaxed">{intellectualProperty}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">User Content</h2>
              <p className="text-gray-300 leading-relaxed">{userContent}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Third-Party Services</h2>
              <p className="text-gray-300 leading-relaxed">{thirdParty}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed">{liability}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Disclaimer of Warranties</h2>
              <p className="text-gray-300 leading-relaxed">{warranties}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Termination</h2>
              <p className="text-gray-300 leading-relaxed">{termination}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Governing Law</h2>
              <p className="text-gray-300 leading-relaxed">{governingLaw}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Changes to Terms</h2>
              <p className="text-gray-300 leading-relaxed">{changesTerms}</p>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Contact Us</h2>
              <p className="text-gray-300 leading-relaxed">
                If you have questions about these Terms of Service, please contact us at:
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
