import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-b border-gray-800 px-5% py-6 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-3xl font-black text-green-500">
            Julyu
          </Link>
          <ul className="hidden md:flex gap-12 list-none">
            <li><Link href="/" className="text-white hover:text-green-500 transition">Home</Link></li>
            <li><Link href="/features" className="text-white hover:text-green-500 transition">Features</Link></li>
            <li><Link href="/pricing" className="text-white hover:text-green-500 transition">Pricing</Link></li>
            <li><Link href="/contact" className="text-white hover:text-green-500 transition">Contact</Link></li>
          </ul>
          <div className="flex gap-4">
            <Link href="/auth/login" className="px-6 py-3 rounded-lg border border-gray-700 text-white hover:border-green-500 transition">
              Sign In
            </Link>
            <Link href="/auth/signup" className="px-6 py-3 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="min-h-screen flex items-center justify-center px-5% pt-24 pb-16 bg-gradient-to-br from-black via-black to-gray-900">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
              The <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Bloomberg Terminal</span> for Grocery Consumers
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed">
              AI-powered price intelligence across 50+ retailers. Save $287/month with professional-grade tools.
            </p>
            <div className="flex gap-4 mb-12">
              <Link href="/auth/signup" className="px-8 py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-lg">
                Start Saving Today
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-black text-green-500 mb-2">$4.2M</div>
                <div className="text-sm text-gray-500">Total Savings</div>
              </div>
              <div>
                <div className="text-4xl font-black text-green-500 mb-2">127K</div>
                <div className="text-sm text-gray-500">Active Users</div>
              </div>
              <div>
                <div className="text-4xl font-black text-green-500 mb-2">23%</div>
                <div className="text-sm text-gray-500">Avg. Savings</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 min-h-[400px] flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">📊</div>
              <div>Price Comparison Demo</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black border-t border-gray-800 py-16 px-5%">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16">
          <div>
            <h3 className="text-2xl font-bold text-green-500 mb-4">Julyu</h3>
            <p className="text-gray-500">AI-powered grocery intelligence that saves you hundreds monthly.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-gray-500 hover:text-green-500">Features</Link></li>
              <li><Link href="/pricing" className="text-gray-500 hover:text-green-500">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-500 hover:text-green-500">About</Link></li>
              <li><Link href="/careers" className="text-gray-500 hover:text-green-500">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-gray-500 hover:text-green-500">Privacy</Link></li>
              <li><Link href="/terms" className="text-gray-500 hover:text-green-500">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>&copy; 2025 Julyu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}


