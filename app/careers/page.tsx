import Link from 'next/link'

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-b border-gray-800 px-5% py-6 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-3xl font-black text-green-500">Julyu</Link>
          <div className="flex gap-4">
            <Link href="/auth/login" className="px-6 py-3 rounded-lg border border-gray-700 text-white hover:border-green-500 transition">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-5%">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-black mb-6">Careers</h1>
          <p className="text-xl text-gray-400 mb-12">Join the Julyu team</p>
          
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <p className="text-gray-400 mb-4">We&apos;re always looking for talented people to join our mission.</p>
            <p className="text-green-500 text-lg">careers@julyu.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}

