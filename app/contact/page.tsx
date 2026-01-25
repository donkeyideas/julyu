import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <div className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-black mb-6">Contact Us</h1>
          <p className="text-xl text-gray-400 mb-12">Get in touch with the Julyu team</p>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <p className="text-gray-400 mb-4">For support, partnerships, or inquiries:</p>
            <p className="text-green-500 text-lg">contact@julyu.com</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
