import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-b border-gray-800 px-5% py-6 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-3xl font-black text-green-500">Julyu</Link>
          <ul className="hidden md:flex gap-12 list-none">
            <li><Link href="/" className="text-white hover:text-green-500">Home</Link></li>
            <li><Link href="/features" className="text-white hover:text-green-500">Features</Link></li>
            <li><Link href="/pricing" className="text-green-500">Pricing</Link></li>
            <li><Link href="/contact" className="text-white hover:text-green-500">Contact</Link></li>
          </ul>
          <div className="flex gap-4">
            <Link href="/auth/login" className="px-6 py-3 rounded-lg border border-gray-700 text-white hover:border-green-500">Sign In</Link>
            <Link href="/auth/signup" className="px-6 py-3 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600">Get Started</Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-16 px-5%">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black mb-4">
              Simple <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Transparent Pricing</span>
            </h1>
            <p className="text-xl text-gray-500">Professional grocery intelligence for everyone</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900 border-2 border-gray-800 rounded-3xl p-8 text-center">
              <div className="text-2xl font-bold mb-4">Free</div>
              <div className="text-5xl font-black text-green-500 mb-2">$0</div>
              <div className="text-gray-500 mb-8">Forever free</div>
              <ul className="text-left space-y-4 mb-8">
                <li className="border-b border-gray-800 pb-4">✓ 5 comparisons/month</li>
                <li className="border-b border-gray-800 pb-4">✓ Basic price tracking</li>
                <li className="pb-4">✓ 3 receipt scans</li>
              </ul>
              <Link href="/auth/signup" className="block w-full py-3 rounded-lg border border-gray-700 text-white hover:border-green-500 text-center">
                Get Started
              </Link>
            </div>

            <div className="bg-gray-900 border-2 border-green-500 rounded-3xl p-8 text-center transform scale-105 shadow-2xl shadow-green-500/20">
              <div className="text-2xl font-bold mb-4">Premium</div>
              <div className="text-5xl font-black text-green-500 mb-2">$15</div>
              <div className="text-gray-500 mb-8">per month</div>
              <ul className="text-left space-y-4 mb-8">
                <li className="border-b border-gray-800 pb-4">✓ Unlimited comparisons</li>
                <li className="border-b border-gray-800 pb-4">✓ Unlimited receipts</li>
                <li className="border-b border-gray-800 pb-4">✓ Price alerts</li>
                <li className="pb-4">✓ Advanced analytics</li>
              </ul>
              <Link href="/auth/signup?tier=premium" className="block w-full py-3 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600 text-center">
                Start Trial
              </Link>
            </div>

            <div className="bg-gray-900 border-2 border-gray-800 rounded-3xl p-8 text-center">
              <div className="text-2xl font-bold mb-4">Enterprise</div>
              <div className="text-3xl font-black text-green-500 mb-2">Custom</div>
              <div className="text-gray-500 mb-8">Contact sales</div>
              <ul className="text-left space-y-4 mb-8">
                <li className="border-b border-gray-800 pb-4">✓ White-label</li>
                <li className="border-b border-gray-800 pb-4">✓ API access</li>
                <li className="pb-4">✓ Dedicated support</li>
              </ul>
              <Link href="/contact" className="block w-full py-3 rounded-lg border border-gray-700 text-white hover:border-green-500 text-center">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


