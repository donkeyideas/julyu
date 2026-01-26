import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-green-900/40 text-white">
      <Header />

      <div className="pt-32 pb-16 px-[5%]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black mb-4">
              Everything You Need to <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Never Overpay</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              AI-powered platform with real-time pricing and intelligent optimization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 hover:border-green-500 transition">
              <div className="text-5xl mb-6">🧠</div>
              <h3 className="text-2xl font-bold mb-4">AI Product Matching</h3>
              <p className="text-gray-500 leading-relaxed">
                DeepSeek-powered semantic understanding matches products across retailers with 98% accuracy.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 hover:border-green-500 transition">
              <div className="text-5xl mb-6">🗺️</div>
              <h3 className="text-2xl font-bold mb-4">Route Optimization</h3>
              <p className="text-gray-500 leading-relaxed">
                Multi-store routing finds optimal paths factoring price, distance, and time value.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 hover:border-green-500 transition">
              <div className="text-5xl mb-6">📸</div>
              <h3 className="text-2xl font-bold mb-4">Receipt Scanning</h3>
              <p className="text-gray-500 leading-relaxed">
                OCR technology extracts prices automatically, building your price history.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
