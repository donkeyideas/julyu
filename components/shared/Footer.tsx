import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-black border-t border-gray-800 py-16 px-[5%]">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-16">
        <div>
          <h3 className="text-2xl font-bold text-green-500 mb-4">Julyu</h3>
          <p className="text-gray-500 mb-4">
            AI-powered grocery intelligence that saves you hundreds monthly.
          </p>
          <div className="flex gap-4">
            <a
              href="https://twitter.com/julyu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-green-500 transition"
              aria-label="Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com/company/julyu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-green-500 transition"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Product</h4>
          <ul className="space-y-3">
            <li>
              <Link href="/features" className="text-gray-500 hover:text-green-500 transition">
                Features
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="text-gray-500 hover:text-green-500 transition">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-green-500 transition">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Company</h4>
          <ul className="space-y-3">
            <li>
              <Link href="/about" className="text-gray-500 hover:text-green-500 transition">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-gray-500 hover:text-green-500 transition">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/careers" className="text-gray-500 hover:text-green-500 transition">
                Careers
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-white">Legal</h4>
          <ul className="space-y-3">
            <li>
              <Link href="/privacy" className="text-gray-500 hover:text-green-500 transition">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-gray-500 hover:text-green-500 transition">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
        <p>&copy; {currentYear} Julyu. All rights reserved.</p>
      </div>
    </footer>
  )
}
