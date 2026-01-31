'use client'

import { useState, useEffect } from 'react'

interface Testimonial {
  id: string
  author_name: string
  author_title: string
  author_location: string
  quote: string
  savings_amount: number
  rating: number
  is_featured: boolean
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    loadTestimonials()
  }, [])

  const loadTestimonials = async () => {
    try {
      const response = await fetch('/api/testimonials')
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data.testimonials || [])
        setEnabled(data.enabled !== false)
      }
    } catch (error) {
      console.error('Failed to load testimonials:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't render if loading, section is disabled, or no testimonials
  if (loading || !enabled || testimonials.length === 0) {
    return null
  }

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const currentTestimonial = testimonials[activeIndex]

  return (
    <section className="py-24 px-[5%] bg-green-950/60">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            What Our <span className="text-green-500">Users</span> Say
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Real savings from real shoppers. See how Julyu is helping families save on groceries.
          </p>
        </div>

        {/* Featured Testimonial */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 md:p-12">
            {/* Quote Icon */}
            <div className="absolute -top-4 left-8 w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>

            {/* Featured Badge */}
            {currentTestimonial.is_featured && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                  Featured
                </span>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-500 text-2xl font-bold">
                  {currentTestimonial.author_name.charAt(0)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="text-xl md:text-2xl text-white leading-relaxed mb-6">
                  &ldquo;{currentTestimonial.quote}&rdquo;
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <div className="font-semibold text-white">{currentTestimonial.author_name}</div>
                    <div className="text-sm text-gray-500">
                      {currentTestimonial.author_title} • {currentTestimonial.author_location}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-800 hidden md:block" />
                  <div className="bg-green-500/10 px-4 py-2 rounded-lg">
                    <div className="text-xs text-gray-500">Saves</div>
                    <div className="text-green-500 font-bold">${currentTestimonial.savings_amount}/month</div>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex items-center gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${
                        i < currentTestimonial.rating ? 'text-yellow-400' : 'text-gray-700'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation - only show if multiple testimonials */}
          {testimonials.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center text-white hover:border-green-500 transition"
                aria-label="Previous testimonial"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === activeIndex ? 'w-8 bg-green-500' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center text-white hover:border-green-500 transition"
                aria-label="Next testimonial"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Average Savings & Trust Badges */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/30">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-green-400 text-sm">
              Avg. savings: <span className="font-bold">${Math.round(testimonials.reduce((sum, t) => sum + t.savings_amount, 0) / testimonials.length)}/month</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Privacy Protected</span>
          </div>
        </div>
      </div>
    </section>
  )
}
