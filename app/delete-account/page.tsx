import type { Metadata } from 'next'
import Header from '@/components/shared/Header'
import Footer from '@/components/shared/Footer'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://julyu.com'

export const metadata: Metadata = {
  title: 'Delete Your Account - Julyu',
  description:
    'Learn how to delete your Julyu account and all associated data.',
  openGraph: {
    title: 'Delete Your Account | Julyu',
    description: 'Steps to delete your Julyu account and data.',
    url: `${baseUrl}/delete-account`,
  },
  alternates: {
    canonical: `${baseUrl}/delete-account`,
  },
}

export default function DeleteAccountPage() {
  return (
    <>
      <Header />
      <main
        className="min-h-screen py-20 px-4"
        style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Delete Your Account</h1>

          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            If you would like to delete your Julyu account and all associated data,
            you can do so directly within the app or by following the steps below.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How to delete your account in the app</h2>
            <ol className="list-decimal list-inside space-y-3" style={{ color: 'var(--text-secondary)' }}>
              <li>Open the Julyu app and sign in to your account.</li>
              <li>Go to <strong>Settings</strong> from the dashboard.</li>
              <li>Scroll to the bottom and tap <strong>&quot;Delete account&quot;</strong>.</li>
              <li>Confirm the deletion when prompted.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">What data is deleted</h2>
            <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
              When you delete your account, the following data is permanently removed:
            </p>
            <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <li>Your account profile (name, email, preferences)</li>
              <li>All scanned receipts and purchase history</li>
              <li>Shopping lists and saved items</li>
              <li>Price alerts and notifications</li>
              <li>Chat history with Jules assistant</li>
              <li>Any other data associated with your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data retention</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Account deletion is permanent and takes effect immediately. All personal data is
              removed from our systems. Anonymized, aggregated data (such as overall price
              trends) that cannot be linked back to you may be retained.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Need help?</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              If you are unable to access your account or need assistance with deletion,
              please contact us at{' '}
              <a
                href="mailto:privacy@julyu.com"
                className="underline"
                style={{ color: 'var(--color-primary)' }}
              >
                privacy@julyu.com
              </a>{' '}
              and we will process your request within 30 days.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
