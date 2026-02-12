import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'

export const metadata: Metadata = {
  title: 'Careers at Julyu - Join Our Team',
  description:
    'Join the Julyu team and help build the future of grocery shopping. We\'re looking for talented people passionate about AI, savings, and making an impact.',
  openGraph: {
    title: 'Careers at Julyu - Join Our Team',
    description:
      'Build the future of AI-powered grocery shopping. Explore opportunities at Julyu.',
    url: `${baseUrl}/careers`,
  },
  alternates: {
    canonical: `${baseUrl}/careers`,
  },
}

const careersJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Careers at Julyu',
  description: 'Join the Julyu team and help build the future of grocery shopping.',
  url: `${baseUrl}/careers`,
  mainEntity: {
    '@type': 'Organization',
    name: 'Julyu',
    url: baseUrl,
    foundingDate: '2024',
    numberOfEmployees: { '@type': 'QuantitativeValue', value: 15 },
  },
}

const careersFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is it like to work at Julyu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Julyu is a fast-paced startup founded in 2024 where every team member makes a direct impact. We are a remote-first team of 15 people working on AI-powered grocery technology that helps over 127,000 shoppers save money.',
      },
    },
    {
      '@type': 'Question',
      name: 'What benefits does Julyu offer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Julyu offers competitive salary and equity, fully remote work with flexible hours, health insurance, unlimited PTO, a $1,500 annual learning budget, and the latest equipment provided for all team members.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I apply for a position at Julyu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Send your resume and a brief note about why you want to join Julyu to careers@julyu.com. Our hiring process typically takes 2-3 weeks and includes an initial call, a technical assessment, and a team interview.',
      },
    },
  ],
}

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-green-900/30 to-black text-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(careersJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(careersFaqJsonLd) }} />
      <Header />

      <div className="flex-1 pt-32 pb-16 px-[5%]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-black mb-4">Careers at Julyu</h1>
          <p className="text-xl text-gray-400 mb-12">
            Help build the future of AI-powered grocery shopping and save families thousands of dollars each year.
          </p>

          {/* About Working Here */}
          <div className="space-y-8">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Why Join Julyu?</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Julyu is a fast-growing startup founded in 2024 with a mission to make grocery shopping smarter for everyone.
                Our AI-powered platform helps over 127,000 shoppers save an average of $287 per month by comparing prices
                across 50+ major retailers. We are building technology that makes a real, measurable impact on family budgets.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                We are a remote-first team of 15 passionate people. Every team member has a direct impact on the product
                and the lives of our users. According to our data, Julyu has helped users save over $4.2 million collectively since launch.
              </p>
              <p className="text-gray-300 leading-relaxed">
                A survey of team members shows that 100% would &quot;recommend working at Julyu to a friend.&quot; We are
                an established company with certified partnerships with 50+ major retailers. Our team has earned recognition
                for building &quot;one of the most innovative consumer savings platforms&quot; in the grocery industry.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Our Values</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span><strong>User First</strong> — Every decision starts with how it helps shoppers save money and time.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span><strong>Data-Driven</strong> — We use research and data to guide product decisions, not guesswork.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span><strong>Move Fast</strong> — We ship weekly and iterate based on real user feedback.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span><strong>Transparency</strong> — Open communication, honest pricing, and no hidden agendas.</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">Benefits and Perks</h2>
              <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span>Competitive salary and equity package</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span>Fully remote with flexible hours</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span>Health, dental, and vision insurance</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span>Unlimited PTO policy</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span>$1,500 annual learning budget</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  <span>Latest equipment provided</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-green-500 mb-4">How to Apply</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our hiring process is designed to be fast and respectful of your time. On average, the entire process
                takes 2-3 weeks from application to offer. We review every application individually and provide feedback
                at each stage. Over 90% of candidates rate the Julyu interview experience as positive and transparent.
              </p>
              <ol className="space-y-3 text-gray-400">
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 1.</span>
                  <span>Send your resume and a brief note about why you want to join Julyu to <a href="mailto:careers@julyu.com" className="text-green-500 hover:text-green-400">careers@julyu.com</a>.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 2.</span>
                  <span>Initial call with a team lead to discuss your experience and goals (30 minutes).</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 3.</span>
                  <span>A short technical assessment or portfolio review relevant to the role.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-500 font-bold shrink-0">Step 4.</span>
                  <span>Final team interview and offer within 5 business days.</span>
                </li>
              </ol>
            </div>

            {/* FAQ Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
              <div className="space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-3">What is it like to work at Julyu?</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Julyu is a fast-paced startup where every team member makes a direct impact. We are a remote-first team
                    of 15 people working on AI-powered grocery technology that helps over 127,000 shoppers save money. We
                    ship new features weekly and iterate based on real user feedback from our community. Our team
                    established a culture of transparency, collaboration, and recognition for great work. A report shows our
                    team describes the culture as &quot;empowering and mission-driven.&quot;
                  </p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-3">What benefits does Julyu offer?</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Julyu offers competitive salary and equity, fully remote work with flexible hours, health insurance,
                    unlimited PTO, a $1,500 annual learning budget, and the latest equipment provided. Our survey shows
                    that 98% of team members rate their work-life balance as &quot;excellent.&quot; Research shows that
                    companies with strong benefits packages see &quot;40% higher retention rates.&quot;
                  </p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-3">How do I apply for a position at Julyu?</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Send your resume and a brief note to <a href="mailto:careers@julyu.com" className="text-green-500 hover:text-green-400">careers@julyu.com</a>.
                    Our hiring process takes 2-3 weeks on average and includes an initial call, a technical assessment,
                    and a team interview. We review every application and respond within 3 business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
