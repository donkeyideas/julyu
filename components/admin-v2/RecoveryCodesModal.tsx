'use client'

import { useState } from 'react'

interface RecoveryCodesModalProps {
  codes: string[]
  onClose: () => void
  onConfirm: () => void
}

export default function RecoveryCodesModal({
  codes,
  onClose,
  onConfirm,
}: RecoveryCodesModalProps) {
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const copyAllCodes = async () => {
    try {
      const text = codes.join('\n')
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadCodes = () => {
    const text = `Julyu Admin Recovery Codes
Generated: ${new Date().toLocaleString()}

Keep these codes safe! Each code can only be used once.

${codes.join('\n')}

If you lose access to your authenticator app, use one of these codes to sign in.
`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'julyu-admin-recovery-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-500 text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">Two-Factor Authentication Enabled!</h2>
              <p className="text-green-100 text-sm">Save your recovery codes</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-red-800">
                <p className="font-semibold">Save these codes now!</p>
                <p>You won&apos;t be able to see them again. Store them securely.</p>
              </div>
            </div>
          </div>

          {/* Codes Grid */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {codes.map((code, index) => (
                <div
                  key={index}
                  className="bg-white border rounded px-3 py-2 font-mono text-center text-lg tracking-wider"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={copyAllCodes}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy All</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={downloadCodes}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>How to use recovery codes:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Each code can only be used once</li>
              <li>Use a recovery code if you lose access to your authenticator app</li>
              <li>Store them in a secure place (password manager, safe, etc.)</li>
              <li>You have {codes.length} recovery codes</li>
            </ul>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">
              I have saved my recovery codes in a secure location
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed}
            className={`
              w-full py-3 rounded-lg font-semibold transition-colors
              ${confirmed
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
