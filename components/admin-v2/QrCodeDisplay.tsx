'use client'

import { useState } from 'react'
import Image from 'next/image'

interface QrCodeDisplayProps {
  qrCodeUrl: string
  secret: string
  email: string
}

export default function QrCodeDisplay({
  qrCodeUrl,
  secret,
  email,
}: QrCodeDisplayProps) {
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied] = useState(false)

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Format secret for easier reading (groups of 4)
  const formattedSecret = secret.match(/.{1,4}/g)?.join(' ') || secret

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Set Up Two-Factor Authentication
        </h3>
        <p className="text-sm text-gray-600">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-xl shadow-lg border">
          <Image
            src={qrCodeUrl}
            alt="QR Code for 2FA setup"
            width={200}
            height={200}
            className="rounded"
          />
        </div>
      </div>

      {/* Account Info */}
      <div className="text-center text-sm text-gray-500">
        <p>Account: <span className="font-medium text-gray-700">{email}</span></p>
        <p>Issuer: <span className="font-medium text-gray-700">Julyu Admin</span></p>
      </div>

      {/* Manual Entry Toggle */}
      <div className="border-t pt-4">
        <button
          type="button"
          onClick={() => setShowSecret(!showSecret)}
          className="w-full text-sm text-green-600 hover:text-green-700 font-medium"
        >
          {showSecret ? 'Hide manual entry code' : "Can't scan? Enter code manually"}
        </button>

        {showSecret && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2 text-center">
              Enter this code manually in your authenticator app:
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-lg font-mono tracking-wider bg-white px-4 py-2 rounded border select-all">
                {formattedSecret}
              </code>
              <button
                type="button"
                onClick={copySecret}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Important</p>
            <p>Make sure to save your recovery codes after setup. You&apos;ll need them if you lose access to your authenticator app.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
