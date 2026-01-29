'use client'

import { useEffect, useState } from 'react'
import { getAdminSession } from '@/lib/auth/admin-auth'

export default function AdminDebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [localStorageKeys, setLocalStorageKeys] = useState<string[]>([])
  const [sessionData, setSessionData] = useState<string>('')

  useEffect(() => {
    // Get admin session
    const session = getAdminSession()
    setSessionInfo(session)

    // Get all localStorage keys
    const keys = Object.keys(localStorage)
    setLocalStorageKeys(keys)

    // Get the specific session data
    const rawSession = localStorage.getItem('julyu_admin_session')
    setSessionData(rawSession || 'NOT FOUND')
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Session Debug</h1>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-green-500 mb-2">Session Status</h2>
            <pre className="bg-black p-4 rounded-lg text-sm overflow-auto">
              {sessionInfo ? JSON.stringify(sessionInfo, null, 2) : 'NO SESSION FOUND'}
            </pre>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-blue-500 mb-2">Raw Session Data</h2>
            <pre className="bg-black p-4 rounded-lg text-sm overflow-auto break-all">
              {sessionData}
            </pre>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-purple-500 mb-2">All localStorage Keys</h2>
            <pre className="bg-black p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(localStorageKeys, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-yellow-500 mb-2">Current Time</h2>
            <pre className="bg-black p-4 rounded-lg text-sm">
              {new Date().toISOString()}
            </pre>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-red-500 mb-2">Window Object</h2>
            <pre className="bg-black p-4 rounded-lg text-sm">
              {typeof window !== 'undefined' ? 'Window is defined' : 'Window is undefined'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
