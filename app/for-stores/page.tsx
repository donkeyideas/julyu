import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

export const metadata = {
  title: 'For Store Owners - Julyu',
  description: 'Bring your local store online with Julyu',
}

export default function ForStoresPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header transparent />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-[5%] pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            For Store Owners
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Grow Your Local Business with <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Julyu</span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-3xl mx-auto">
            Join NYC&apos;s local stores that are reaching new customers and increasing revenue through Julyu&apos;s digital storefront platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/store-portal/apply"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition text-lg text-center shadow-lg"
            >
              Apply to Join
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 border border-gray-700 text-white font-semibold rounded-lg hover:border-blue-500 transition text-lg text-center"
            >
              Learn How It Works
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-blue-500 mb-1">15%</div>
              <div className="text-sm text-gray-500">Starting Commission</div>
            </div>
            <div>
              <div className="text-4xl font-black text-blue-500 mb-1">1-2 Days</div>
              <div className="text-sm text-gray-500">Approval Time</div>
            </div>
            <div>
              <div className="text-4xl font-black text-blue-500 mb-1">Weekly</div>
              <div className="text-sm text-gray-500">Payouts</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gradient-to-b from-gray-900 to-black py-24 px-[5%]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            How <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">It Works</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 text-2xl font-black">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Apply</h3>
              <p className="text-gray-400">
                Fill out a simple application with your store details. Takes less than 5 minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 text-2xl font-black">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Get Approved</h3>
              <p className="text-gray-400">
                Our team reviews your application. Most stores are approved within 1-2 business days.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 text-2xl font-black">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Add Inventory</h3>
              <p className="text-gray-400">
                Upload receipts, enter products manually, or connect your POS system for automatic sync.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 text-2xl font-black">
                4
              </div>
              <h3 className="text-xl font-bold mb-3">Receive Orders</h3>
              <p className="text-gray-400">
                Start receiving orders from local customers. DoorDash handles delivery for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-black py-24 px-[5%]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            Why Store Owners <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Love Julyu</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">New Revenue Stream</h3>
              <p className="text-gray-400">
                Add online ordering without changing how you run your store. Keep doing what you do best - we handle the technology.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Reach More Customers</h3>
              <p className="text-gray-400">
                Get discovered by customers searching for products near them. Appear in search results alongside major retailers.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Easy Inventory Management</h3>
              <p className="text-gray-400">
                Multiple ways to manage inventory: upload supplier receipts, manual entry, or connect your POS system for automatic sync.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">DoorDash Delivery</h3>
              <p className="text-gray-400">
                Integrated delivery through DoorDash. You focus on preparing orders - we coordinate the pickup and delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gradient-to-b from-gray-900 to-black py-24 px-[5%]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-6">
            Simple, <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Pay only when you make sales. No hidden fees or monthly charges.
          </p>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-10 border border-gray-700">
            <div className="text-center mb-8">
              <div className="text-6xl font-black text-blue-500 mb-2">15%</div>
              <div className="text-xl text-gray-400">Commission per order</div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">No setup fees or monthly charges</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Weekly payouts via Stripe</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Lower commission rates available for high-volume stores</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-300">Cancel anytime, no long-term contracts</span>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/store-portal/apply"
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition text-lg shadow-lg"
              >
                Start Your Application
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-black py-24 px-[5%]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
            Frequently Asked <span className="bg-gradient-to-r from-green-500 to-green-300 bg-clip-text text-transparent">Questions</span>
          </h2>

          <div className="space-y-6">
            <details className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <summary className="font-semibold cursor-pointer text-lg">
                What types of stores can join Julyu?
              </summary>
              <p className="text-gray-400 mt-4">
                We work with bodegas, convenience stores, corner stores, small grocery stores, and local markets. If you sell groceries or household items, you&apos;re a good fit!
              </p>
            </details>

            <details className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <summary className="font-semibold cursor-pointer text-lg">
                Do I need a POS system?
              </summary>
              <p className="text-gray-400 mt-4">
                No! While we can integrate with Square and Clover POS systems, you can also manage inventory by uploading supplier receipts or entering products manually.
              </p>
            </details>

            <details className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <summary className="font-semibold cursor-pointer text-lg">
                How do I receive orders?
              </summary>
              <p className="text-gray-400 mt-4">
                You&apos;ll receive real-time notifications via email and through your store portal dashboard. You can accept or decline orders based on product availability.
              </p>
            </details>

            <details className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <summary className="font-semibold cursor-pointer text-lg">
                Who handles delivery?
              </summary>
              <p className="text-gray-400 mt-4">
                DoorDash handles all deliveries through their Drive API. You prepare the order, and a DoorDash driver picks it up and delivers it to the customer.
              </p>
            </details>

            <details className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <summary className="font-semibold cursor-pointer text-lg">
                When do I get paid?
              </summary>
              <p className="text-gray-400 mt-4">
                Payouts are processed weekly via Stripe Connect. You&apos;ll need to set up a Stripe account (free) to receive your earnings.
              </p>
            </details>

            <details className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <summary className="font-semibold cursor-pointer text-lg">
                Can I set my own prices?
              </summary>
              <p className="text-gray-400 mt-4">
                Yes! You have full control over your pricing. Set prices that work for your business and customers.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-b from-gray-900 to-black py-24 px-[5%]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join other local stores that are increasing revenue with Julyu
          </p>
          <Link
            href="/store-portal/apply"
            className="inline-block px-10 py-5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition text-xl shadow-lg"
          >
            Apply Now - It&apos;s Free
          </Link>
          <p className="text-sm text-gray-500 mt-6">
            Application takes less than 5 minutes • No credit card required
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
