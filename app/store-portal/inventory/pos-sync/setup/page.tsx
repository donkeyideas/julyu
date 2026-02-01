'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const providerInfo: Record<string, {
  name: string
  setupUrl: string
  requirements: string[]
}> = {
  square: {
    name: 'Square',
    setupUrl: 'https://developer.squareup.com/apps',
    requirements: [
      'Create a Square Developer account',
      'Create an application in the Square Developer Dashboard',
      'Get your Application ID and Application Secret',
      'Configure OAuth redirect URL',
    ],
  },
  clover: {
    name: 'Clover',
    setupUrl: 'https://www.clover.com/developers',
    requirements: [
      'Create a Clover Developer account',
      'Create an app in the Clover Developer Dashboard',
      'Get your App ID and App Secret',
      'Configure OAuth redirect URL',
    ],
  },
  toast: {
    name: 'Toast',
    setupUrl: 'https://doc.toasttab.com/doc/devguide/index.html',
    requirements: [
      'Apply for Toast Partner Program',
      'Get approved as a Toast integration partner',
      'Receive API credentials from Toast',
      'Configure OAuth settings',
    ],
  },
  shopify: {
    name: 'Shopify',
    setupUrl: 'https://partners.shopify.com',
    requirements: [
      'Create a Shopify Partner account',
      'Create a custom app or public app',
      'Get your API Key and API Secret',
      'Configure app permissions for inventory access',
    ],
  },
}

export default function POSSetupPage() {
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider') || 'unknown'
  const info = providerInfo[provider]

  if (!info) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-lg p-8 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-primary)' }}>Unknown provider</p>
          <Link href="/store-portal/inventory/pos-sync" className="text-green-500 mt-4 inline-block">
            Back to POS Integration
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/store-portal/inventory/pos-sync"
          className="text-sm text-green-500 hover:text-green-400 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to POS Integration
        </Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
          {info.name} Setup Required
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          API credentials need to be configured to connect {info.name}
        </p>
      </div>

      <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Configuration Required
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {info.name} integration requires API credentials that have not been configured yet.
            </p>
          </div>
        </div>

        <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--border-color)' }}>
          <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
            Setup Requirements:
          </h4>
          <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {info.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ol>
        </div>

        <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--border-color)' }}>
          <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
            Next Steps:
          </h4>
          <div className="space-y-3">
            <a
              href={info.setupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-green-500/10"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Visit {info.name} Developer Portal
              </span>
              <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Once you have your API credentials, contact the administrator to configure them in the system.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center space-x-3">
        <Link
          href="/store-portal/inventory/add"
          className="px-4 py-2 bg-green-500 text-black font-medium rounded-md hover:bg-green-400"
        >
          Add Products Manually
        </Link>
        <Link
          href="/store-portal/inventory/pos-sync"
          className="px-4 py-2 font-medium rounded-md"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
        >
          Back to POS Options
        </Link>
      </div>
    </div>
  )
}
