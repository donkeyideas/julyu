'use client'

import { useState } from 'react'
import Link from 'next/link'

interface RequestDemoModalProps {
  defaultInterest?: string
  buttonText?: string
  buttonClassName?: string
}

export default function RequestDemoModal({
  defaultInterest = '',
  buttonText = 'Request Demo',
  buttonClassName = 'px-8 py-4 border border-gray-700 text-white font-semibold rounded-lg hover:border-green-500 transition text-lg text-center',
}: RequestDemoModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    business_name: '',
    business_type: '',
    interest: defaultInterest,
    message: '',
    honeypot: '',
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

  const handleClose = () => {
    setOpen(false)
    if (submitted) {
      setSubmitted(false)
      setFormData({
        name: '',
        email: '',
        business_name: '',
        business_type: '',
        interest: defaultInterest,
        message: '',
        honeypot: '',
      })
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={buttonClassName}>
        {buttonText}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={handleClose}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 md:p-8"
            style={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Request Submitted
                </div>
                <h2 className="text-2xl font-black text-white mb-4">Thank You!</h2>
                <p className="text-gray-400 mb-6">
                  We&apos;ve received your demo request. Our team will review it and send you a demo access code within 24 hours.
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  Already have a code?{' '}
                  <Link href="/demo/enter" className="text-green-500 hover:text-green-400 font-medium">
                    Enter it here
                  </Link>
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white mb-2">
                    Request <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Demo Access</span>
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Fill out the form below and we&apos;ll send you a demo access code within 24 hours.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot */}
                  <input
                    type="text"
                    name="honeypot"
                    value={formData.honeypot}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="John Smith"
                        className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="john@company.com"
                        className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleChange}
                      placeholder="Optional"
                      className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Business Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="business_type"
                      value={formData.business_type}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
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
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
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
                          className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition text-sm ${
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
                            className="mt-0.5 accent-green-500"
                          />
                          <div>
                            <div className="text-white font-medium">{option.label}</div>
                            <div className="text-gray-500 text-xs">{option.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Message (optional)
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us what you'd like to see..."
                      rows={2}
                      maxLength={500}
                      className="w-full px-3 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
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
                    className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Request Demo Access'}
                  </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-500">
                  Already have a demo code?{' '}
                  <Link href="/demo/enter" className="text-green-500 hover:text-green-400 font-medium">
                    Enter it here
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
