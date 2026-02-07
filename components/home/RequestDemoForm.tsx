'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RequestDemoForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    business_name: '',
    business_type: '',
    interest: '',
    message: '',
    honeypot: '', // Bot protection
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/demo/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <section id="request-demo" className="py-24 px-[5%]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Request Submitted
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Thank You!
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            We&apos;ve received your demo request. Our team will review it and send you a demo access code within 24 hours.
          </p>
          <p className="text-gray-500 text-sm">
            Already have a code?{' '}
            <Link href="/demo/enter" className="text-green-500 hover:text-green-400 font-medium">
              Enter it here
            </Link>
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="request-demo" className="py-24 px-[5%]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Try Before You Commit
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Request <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Demo Access</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Get a personalized demo of the Julyu platform. See how it works for shoppers comparing prices or for store owners managing inventory.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Honeypot - hidden from real users */}
            <input
              type="text"
              name="honeypot"
              value={formData.honeypot}
              onChange={handleChange}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Smith"
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Business Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@company.com"
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Business Name
              </label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Business Type <span className="text-red-400">*</span>
              </label>
              <select
                name="business_type"
                value={formData.business_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select your type...</option>
                <option value="consumer">Consumer / Shopper</option>
                <option value="grocery_chain">Grocery Chain</option>
                <option value="independent_store">Independent Grocery Store</option>
                <option value="bodega">Bodega / Corner Store</option>
                <option value="market">Specialty Market</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                What are you interested in? <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {[
                  { value: 'user_demo', label: 'User Dashboard Demo', desc: 'Price comparison, savings tracking, budget tools' },
                  { value: 'store_demo', label: 'Store Portal Demo', desc: 'Inventory management, orders, analytics' },
                  { value: 'both', label: 'Both Demos', desc: 'Full platform experience' },
                ].map(option => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      formData.interest === option.value
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="interest"
                      value={option.value}
                      checked={formData.interest === option.value}
                      onChange={handleChange}
                      required
                      className="mt-1 accent-green-500"
                    />
                    <div>
                      <div className="text-white font-medium text-sm">{option.label}</div>
                      <div className="text-gray-500 text-xs">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Message (optional)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us what you'd like to see..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Request Demo Access'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have a demo code?{' '}
            <Link href="/demo/enter" className="text-green-500 hover:text-green-400 font-medium">
              Enter it here
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
