'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'
import { FEATURE_LABELS } from '@/shared/types/subscriptions'
import type { SubscriptionPlan, FeatureKey } from '@/shared/types/subscriptions'

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState<{
    valid: boolean
    error?: string
    promo?: { type: string; value: number; description: string | null }
  } | null>(null)
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans')
      const data = await response.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleValidatePromo = async (planSlug: string) => {
    if (!promoCode.trim()) return

    setValidatingPromo(true)
    setPromoResult(null)
    try {
      const response = await fetch('/api/subscriptions/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim(), planSlug }),
      })
      const data = await response.json()
      setPromoResult(data)
    } catch {
      setPromoResult({ valid: false, error: 'Failed to validate promo code' })
    } finally {
      setValidatingPromo(false)
    }
  }

  const handleCheckout = async (planSlug: string) => {
    setCheckingOut(planSlug)
    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug,
          promoCode: promoResult?.valid ? promoCode.trim() : undefined,
        }),
      })
      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to start checkout')
      }
    } catch (error: any) {
      alert(error.message || 'Checkout failed')
    } finally {
      setCheckingOut(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/30 to-black text-white flex flex-col">
      <Header />

      <div className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black mb-4">
              Simple <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Transparent Pricing</span>
            </h1>
            <p className="text-xl text-gray-500">Professional grocery intelligence for everyone</p>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-16">Loading plans...</div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-8">
                {plans.map(plan => {
                  const features = Array.isArray(plan.features) ? plan.features : []
                  const isHighlighted = plan.highlight
                  const isFree = plan.price === 0 && plan.is_self_serve
                  const isEnterprise = !plan.is_self_serve

                  return (
                    <div
                      key={plan.id}
                      className={`bg-gray-900 rounded-3xl p-8 text-center ${
                        isHighlighted
                          ? 'border-2 border-green-500 transform scale-105 shadow-2xl shadow-green-500/20'
                          : 'border-2 border-gray-800'
                      }`}
                    >
                      <div className="text-2xl font-bold mb-4">{plan.name}</div>
                      <div className="text-5xl font-black text-green-500 mb-2">
                        {isEnterprise ? 'Custom' : `$${plan.price}`}
                      </div>
                      <div className="text-gray-500 mb-8">
                        {isFree ? 'Forever free' : isEnterprise ? 'Contact sales' : `per ${plan.billing_interval}`}
                      </div>

                      <ul className="text-left space-y-4 mb-8">
                        {features.map((feature, i) => (
                          <li
                            key={feature}
                            className={i < features.length - 1 ? 'border-b border-gray-800 pb-4' : 'pb-4'}
                          >
                            <span className="text-green-500 mr-2">&#10003;</span>
                            {FEATURE_LABELS[feature as FeatureKey] || feature}
                          </li>
                        ))}
                      </ul>

                      {plan.description && (
                        <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                      )}

                      {isFree && (
                        <Link
                          href="/auth/signup"
                          className="block w-full py-3 rounded-lg border border-gray-700 text-white hover:border-green-500 text-center"
                        >
                          Get Started
                        </Link>
                      )}

                      {plan.is_self_serve && plan.price > 0 && (
                        <button
                          onClick={() => handleCheckout(plan.slug)}
                          disabled={checkingOut === plan.slug}
                          className="block w-full py-3 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-600 disabled:opacity-50"
                        >
                          {checkingOut === plan.slug ? 'Loading...' : 'Subscribe'}
                        </button>
                      )}

                      {isEnterprise && (
                        <Link
                          href="/contact"
                          className="block w-full py-3 rounded-lg border border-gray-700 text-white hover:border-green-500 text-center"
                        >
                          Contact Sales
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Promo Code Section */}
              <div className="max-w-md mx-auto mt-12">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                  <h3 className="text-lg font-semibold mb-3">Have a promo code?</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase())
                        setPromoResult(null)
                      }}
                      placeholder="Enter code"
                      className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm focus:border-green-500 focus:outline-none font-mono"
                    />
                    <button
                      onClick={() => handleValidatePromo('premium')}
                      disabled={validatingPromo || !promoCode.trim()}
                      className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm"
                    >
                      {validatingPromo ? '...' : 'Apply'}
                    </button>
                  </div>
                  {promoResult && (
                    <div className={`mt-3 text-sm ${promoResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                      {promoResult.valid
                        ? `Code applied! ${promoResult.promo?.type === 'free_months'
                            ? `${promoResult.promo.value} month(s) free`
                            : promoResult.promo?.type === 'percentage'
                            ? `${promoResult.promo.value}% off`
                            : `$${promoResult.promo?.value} off`
                          }`
                        : promoResult.error || 'Invalid code'}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
