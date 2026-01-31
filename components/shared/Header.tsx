'use client'

import Link from 'next/link'
import { useState } from 'react'

interface HeaderProps {
  transparent?: boolean
}

export default function Header({ transparent = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className={`fixed top-0 left-0 right-0 ${transparent ? 'bg-black/80' : 'bg-black/95'} backdrop-blur-lg border-b border-gray-800 px-[5%] py-6 z-50`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-3xl font-black text-green-500">
          Julyu
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex gap-12 list-none">
          <li>
            <Link href="/" className="text-white hover:text-green-500 transition">
              Home
            </Link>
          </li>
          <li>
            <Link href="/features" className="text-white hover:text-green-500 transition">
              Features
            </Link>
          </li>
          <li>
            <Link href="/pricing" className="text-white hover:text-green-500 transition">
              Pricing
            </Link>
          </li>
          <li>
            <Link href="/for-stores" className="text-white hover:text-green-500 transition">
              For Stores
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-white hover:text-green-500 transition">
              Contact
            </Link>
          </li>
        </ul>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex gap-4">
          <Link
            href="/auth/login"
            className="px-6 py-3 rounded-lg border border-gray-700 text-white hover:border-green-500 transition"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-3 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600 transition"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-800 pt-4">
          <ul className="flex flex-col gap-4 list-none mb-6">
            <li>
              <Link href="/" className="text-white hover:text-green-500 transition block py-2">
                Home
              </Link>
            </li>
            <li>
              <Link href="/features" className="text-white hover:text-green-500 transition block py-2">
                Features
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="text-white hover:text-green-500 transition block py-2">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/for-stores" className="text-white hover:text-green-500 transition block py-2">
                For Stores
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-white hover:text-green-500 transition block py-2">
                Contact
              </Link>
            </li>
          </ul>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="px-6 py-3 rounded-lg border border-gray-700 text-white hover:border-green-500 transition text-center"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-6 py-3 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600 transition text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
