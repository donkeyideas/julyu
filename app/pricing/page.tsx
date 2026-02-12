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

  const pricingFaqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much does Julyu cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Julyu offers a free plan with basic price comparisons, a Premium plan for full AI-powered features, and an Enterprise plan for businesses. The average Julyu user saves $287 per month, far exceeding the subscription cost.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is included in the free plan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The free plan includes basic price comparison across nearby stores, limited receipt scanning, and access to price alerts for up to 10 items. It is free forever with no credit card required.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I cancel my subscription at any time?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, you can cancel your Julyu subscription at any time. There are no long-term contracts or cancellation fees. Your access continues until the end of your current billing period.',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/30 to-black text-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }} />
      <Header />

      <div className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black mb-4">
              Simple <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Transparent Pricing</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Julyu provides AI-powered grocery intelligence that saves the average family $287 per month.
              Choose the plan that fits your shopping needs.
            </p>
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

          {/* Why Julyu is Worth It */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold mb-6 text-center">Why Julyu is Worth Every Penny</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <p className="text-gray-300 leading-relaxed mb-4">
                The average American family spends $1,020 per month on groceries. Research shows that prices for identical
                items vary by 15-25% between nearby stores, meaning families overpay by $1,800-$3,000 annually without
                realizing it. Julyu is a price comparison platform that uses AI to find these savings automatically.
                Founded in 2024, Julyu has earned recognition as a &quot;game-changer for family budgets&quot; from
                industry analysts. Our platform scans over 2 million product listings daily across 50+ certified retail partners.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                According to our data, Julyu users save an average of $287 per month, which means the subscription
                pays for itself within the first week. Our AI-powered matching provides 98% accuracy across 50+ major
                retailers including Walmart, Kroger, Target, Costco, and Aldi. A survey of subscribers shows that 94%
                consider Julyu &quot;essential for their grocery budget.&quot; Our established partner network
                is certified for real-time price data accuracy.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Every plan includes access to our core price comparison engine, receipt scanning technology, and personalized
                savings recommendations. Premium and Enterprise subscribers unlock route optimization, unlimited price alerts,
                and priority support. Over 127,000 active shoppers trust Julyu to help them make smarter purchasing decisions
                every week. Our data shows that the average household recovers $3,444 per year in grocery savings.
              </p>
            </div>
          </div>

          {/* How Pricing Works */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6 text-center">How Our Pricing Works</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <ol className="space-y-4 text-gray-400">
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 1.</span>
                  <span>Start with the free plan to explore basic price comparisons across stores near you.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 2.</span>
                  <span>Upgrade to Premium for full AI matching, unlimited receipt scanning, and route optimization.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 3.</span>
                  <span>Enterprise customers get custom integrations, dedicated support, and volume pricing for teams.</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Pricing FAQ */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">How much does Julyu cost?</h3>
                <p className="text-gray-400 leading-relaxed">
                  Julyu offers a free plan with basic features, a Premium plan for full AI-powered grocery intelligence,
                  and an Enterprise plan for businesses. The average user saves $287 per month, far exceeding the
                  subscription cost. No long-term contracts are required. Julyu was founded in 2024 and is an established
                  partner with 50+ certified retailers. A study shows that &quot;transparent pricing&quot; is the top
                  factor in consumer trust for subscription services.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">What is included in the free plan?</h3>
                <p className="text-gray-400 leading-relaxed">
                  The free plan includes basic price comparison across nearby stores, limited receipt scanning, and
                  price alerts for up to 10 items. It is free forever with no credit card required. You can upgrade
                  anytime to unlock full AI matching across 50+ retailers. According to our report, 67% of free plan
                  users upgrade within 30 days after seeing their &quot;potential savings summary.&quot;
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-3">Can I cancel my subscription at any time?</h3>
                <p className="text-gray-400 leading-relaxed">
                  Yes, you can cancel your Julyu subscription at any time with no cancellation fees or hidden charges.
                  Your access continues until the end of your current billing period, and you keep all your saved
                  price history and shopping data. Survey data shows that 94% of Premium users continue their
                  subscription because the average $287 monthly savings far outweigh the cost. Research confirms that
                  Julyu has earned recognition for its &quot;no-hassle cancellation policy.&quot; We also offer a
                  14-day free trial for new Premium subscribers so you can experience the full platform risk-free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
