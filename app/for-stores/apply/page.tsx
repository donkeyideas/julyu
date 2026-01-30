'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export default function StoreApplicationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'bodega',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    taxId: '',
    businessLicense: '',
    storeName: '',
    storeAddress: '',
    storeCity: '',
    storeState: '',
    storeZip: '',
    storePhone: '',
    hasPosSystem: false,
    posSystemName: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/store-portal/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      // Redirect to thank you page
      router.push('/for-stores/apply/thank-you')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-blue-950 text-white">
      <Header transparent />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Apply to Become a <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Store Partner</span>
          </h1>
          <p className="text-xl text-gray-400">
            Join Julyu and start receiving orders from customers in your area
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-8">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-md p-4">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Business Information */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Business Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-300 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    required
                    value={formData.businessName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Joe's Market LLC"
                  />
                </div>

                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-gray-300 mb-1">
                    Business Type *
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    required
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bodega">Bodega</option>
                    <option value="convenience">Convenience Store</option>
                    <option value="grocery">Grocery Store</option>
                    <option value="market">Market</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-300 mb-1">
                    Business Address *
                  </label>
                  <input
                    type="text"
                    id="businessAddress"
                    name="businessAddress"
                    required
                    value={formData.businessAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 Main St, New York, NY 10001"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-300 mb-1">
                      Business Phone *
                    </label>
                    <input
                      type="tel"
                      id="businessPhone"
                      name="businessPhone"
                      required
                      value={formData.businessPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-300 mb-1">
                      Business Email *
                    </label>
                    <input
                      type="email"
                      id="businessEmail"
                      name="businessEmail"
                      required
                      value={formData.businessEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="joe@market.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium text-gray-300 mb-1">
                      Tax ID / EIN (Optional)
                    </label>
                    <input
                      type="text"
                      id="taxId"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="12-3456789"
                    />
                  </div>

                  <div>
                    <label htmlFor="businessLicense" className="block text-sm font-medium text-gray-300 mb-1">
                      Business License # (Optional)
                    </label>
                    <input
                      type="text"
                      id="businessLicense"
                      name="businessLicense"
                      value={formData.businessLicense}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="BL-123456"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Store Location */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Store Location</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="storeName" className="block text-sm font-medium text-gray-300 mb-1">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    required
                    value={formData.storeName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Joe's Bodega"
                  />
                  <p className="mt-1 text-sm text-gray-400">This is the name customers will see</p>
                </div>

                <div>
                  <label htmlFor="storeAddress" className="block text-sm font-medium text-gray-300 mb-1">
                    Store Address *
                  </label>
                  <input
                    type="text"
                    id="storeAddress"
                    name="storeAddress"
                    required
                    value={formData.storeAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="456 Store St"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="storeCity" className="block text-sm font-medium text-gray-300 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      id="storeCity"
                      name="storeCity"
                      required
                      value={formData.storeCity}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <label htmlFor="storeState" className="block text-sm font-medium text-gray-300 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      id="storeState"
                      name="storeState"
                      required
                      maxLength={2}
                      value={formData.storeState}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="NY"
                    />
                  </div>

                  <div>
                    <label htmlFor="storeZip" className="block text-sm font-medium text-gray-300 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      id="storeZip"
                      name="storeZip"
                      required
                      value={formData.storeZip}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10001"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="storePhone" className="block text-sm font-medium text-gray-300 mb-1">
                    Store Phone *
                  </label>
                  <input
                    type="tel"
                    id="storePhone"
                    name="storePhone"
                    required
                    value={formData.storePhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(555) 987-6543"
                  />
                </div>
              </div>
            </div>

            {/* POS System */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Point of Sale System</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="hasPosSystem"
                    name="hasPosSystem"
                    checked={formData.hasPosSystem}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 text-blue-500 focus:ring-blue-500 bg-gray-800 border-gray-700 rounded"
                  />
                  <label htmlFor="hasPosSystem" className="ml-2 block text-sm text-gray-300">
                    I use a Point of Sale (POS) system
                  </label>
                </div>

                {formData.hasPosSystem && (
                  <div>
                    <label htmlFor="posSystemName" className="block text-sm font-medium text-gray-300 mb-1">
                      POS System Name
                    </label>
                    <input
                      type="text"
                      id="posSystemName"
                      name="posSystemName"
                      value={formData.posSystemName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Square, Clover, Toast, etc."
                    />
                    <p className="mt-1 text-sm text-gray-400">
                      We can automatically sync your inventory if you use Square or Clover
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="border-t border-gray-800 pt-6">
              <div className="flex items-center justify-between">
                <Link
                  href="/for-stores"
                  className="text-sm font-medium text-gray-400 hover:text-white transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <p className="text-sm text-blue-200">
                <strong className="text-blue-100">What happens next?</strong> After submitting, our team will review your application within 1-2 business days. You&apos;ll receive an email notification once your application is approved.
              </p>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}
