import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { getPageContent } from '@/lib/content/getPageContent'

// Default content - used if no database content exists
const defaultContent = {
  headline: 'Contact Us',
  subheadline: 'Get in touch with the Julyu team',
  email: 'contact@julyu.com',
}

export default async function ContactPage() {
  // Try to fetch dynamic content from database
  const pageContent = await getPageContent('contact')

  // Use database content if available, otherwise use defaults
  const headline = pageContent?.headline || defaultContent.headline
  const subheadline = pageContent?.subheadline || defaultContent.subheadline
  const email = pageContent?.content?.email || defaultContent.email

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-green-900/40 text-white flex flex-col">
      <Header />

      <div className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-black mb-6">{headline}</h1>
          <p className="text-xl text-gray-400 mb-12">{subheadline}</p>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <p className="text-gray-400 mb-4">For support, partnerships, or inquiries:</p>
            <a href={`mailto:${email}`} className="text-green-500 text-lg hover:text-green-400 transition">
              {email}
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
