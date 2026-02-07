'use client'

import { useEffect, useState } from 'react'

interface DemoRequest {
  id: string
  created_at: string
  name: string
  email: string
  business_name: string
  business_type: string
  interest: string
  message: string | null
  status: string
  reviewed_at: string | null
  rejection_reason: string | null
}

interface DemoCode {
  id: string
  code: string
  demo_type: string
  email: string
  name: string | null
  is_active: boolean
  uses_count: number
  max_uses: number
  expires_at: string
  created_at: string
}

interface Stats {
  pending: number
  approved: number
  activeCodes: number
  totalUses: number
}

type Tab = 'requests' | 'codes' | 'generate'

export default function DemoCodesPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('requests')
  const [requests, setRequests] = useState<DemoRequest[]>([])
  const [codes, setCodes] = useState<DemoCode[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, activeCodes: 0, totalUses: 0 })
  const [actionLoading, setActionLoading] = useState(false)

  // View modal
  const [viewModal, setViewModal] = useState<{ open: boolean; request: DemoRequest | null }>({ open: false, request: null })

  // Approve modal
  const [approveModal, setApproveModal] = useState<{ open: boolean; request: DemoRequest | null }>({ open: false, request: null })
  const [approveDemoType, setApproveDemoType] = useState<string>('both')

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ open: boolean; request: DemoRequest | null }>({ open: false, request: null })
  const [rejectReason, setRejectReason] = useState('')

  // Generate form
  const [generateForm, setGenerateForm] = useState({ email: '', name: '', demo_type: 'both', expires_days: '30' })
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [generateLoading, setGenerateLoading] = useState(false)

  // Clipboard feedback
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (activeTab === 'codes') {
      loadCodes()
    }
  }, [activeTab])

  const loadData = async () => {
    try {
      const response = await fetch('/api/admin/demo-codes?tab=requests')
      const data = await response.json()
      if (response.ok) {
        setRequests(data.requests || [])
        setStats(data.stats || { pending: 0, approved: 0, activeCodes: 0, totalUses: 0 })
      }
    } catch (error) {
      console.error('Error loading demo requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCodes = async () => {
    try {
      const response = await fetch('/api/admin/demo-codes?tab=codes')
      const data = await response.json()
      if (response.ok) {
        setCodes(data.codes || [])
      }
    } catch (error) {
      console.error('Error loading demo codes:', error)
    }
  }

  const handleApprove = async () => {
    if (!approveModal.request) return
    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/demo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: approveModal.request.id,
          email: approveModal.request.email,
          name: approveModal.request.name,
          demo_type: approveDemoType,
          expires_days: 30,
        }),
      })
      if (response.ok) {
        setApproveModal({ open: false, request: null })
        setApproveDemoType('both')
        await loadData()
        await loadCodes()
      }
    } catch (error) {
      console.error('Error approving request:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectModal.request) return
    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/demo-codes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rejectModal.request.id,
          action: 'reject',
          type: 'request',
          rejection_reason: rejectReason,
        }),
      })
      if (response.ok) {
        setRejectModal({ open: false, request: null })
        setRejectReason('')
        await loadData()
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteRequest = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/demo-codes?id=${encodeURIComponent(id)}&type=request`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Error deleting request:', error)
    }
  }

  const handleDeleteCode = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/demo-codes?id=${encodeURIComponent(id)}&type=code`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await loadCodes()
        await loadData()
      }
    } catch (error) {
      console.error('Error deleting code:', error)
    }
  }

  const handleToggleActive = async (code: DemoCode) => {
    const action = code.is_active ? 'deactivate' : 'reactivate'
    try {
      const response = await fetch('/api/admin/demo-codes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: code.id, action }),
      })
      if (response.ok) {
        await loadCodes()
        await loadData()
      }
    } catch (error) {
      console.error('Error toggling code:', error)
    }
  }

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCodeId(id)
      setTimeout(() => setCopiedCodeId(null), 2000)
    } catch (error) {
      console.error('Error copying code:', error)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!generateForm.email || !generateForm.demo_type) return
    setGenerateLoading(true)
    setGeneratedCode(null)
    try {
      const response = await fetch('/api/admin/demo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: generateForm.email,
          name: generateForm.name || null,
          demo_type: generateForm.demo_type,
          expires_days: parseInt(generateForm.expires_days),
        }),
      })
      const data = await response.json()
      if (response.ok && data.code) {
        setGeneratedCode(data.code.code)
        setGenerateForm({ email: '', name: '', demo_type: 'both', expires_days: '30' })
        await loadData()
        await loadCodes()
      }
    } catch (error) {
      console.error('Error generating code:', error)
    } finally {
      setGenerateLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/15 text-amber-500',
      approved: 'bg-green-500/15 text-green-500',
      rejected: 'bg-red-500/15 text-red-500',
    }
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${colors[status] || 'bg-gray-500/15 text-gray-500'}`}>
        {status}
      </span>
    )
  }

  const demoTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      user: 'User Demo',
      store: 'Store Demo',
      both: 'Both',
      user_demo: 'User Dashboard Demo',
      store_demo: 'Store Portal Demo',
    }
    return labels[type] || type
  }

  const businessTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      consumer: 'Consumer / Shopper',
      grocery_chain: 'Grocery Chain',
      independent_store: 'Independent Grocery Store',
      bodega: 'Bodega / Corner Store',
      market: 'Specialty Market',
      other: 'Other',
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }}></div>
          <div style={{ color: 'var(--text-secondary)' }}>Loading demo management...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Demo Management</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Manage demo access codes and requests</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Pending Requests</div>
          <div className="text-4xl font-black text-amber-500">{stats.pending}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Awaiting review</div>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Approved Requests</div>
          <div className="text-4xl font-black text-green-500">{stats.approved}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Codes issued</div>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Active Codes</div>
          <div className="text-4xl font-black text-blue-500">{stats.activeCodes}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Currently usable</div>
        </div>
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Total Uses</div>
          <div className="text-4xl font-black text-purple-500">{stats.totalUses}</div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Across all codes</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-0 mb-8" style={{ borderBottom: '1px solid var(--border-color)' }}>
        {([
          { key: 'requests' as Tab, label: 'Demo Requests' },
          { key: 'codes' as Tab, label: 'Demo Codes' },
          { key: 'generate' as Tab, label: 'Generate Code' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-6 py-3 text-sm font-semibold transition"
            style={{
              color: activeTab === tab.key ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-primary)' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Demo Requests */}
      {activeTab === 'requests' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Business</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Interest</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    onClick={() => setViewModal({ open: true, request: req })}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(req.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {req.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {req.email}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {req.business_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {req.business_type || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {demoTypeLabel(req.interest) || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {statusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => { setApproveModal({ open: true, request: req }); setApproveDemoType('both') }}
                              className="px-3 py-1 text-xs font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setRejectModal({ open: true, request: req }); setRejectReason('') }}
                              className="px-3 py-1 text-xs font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg transition"
                          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {requests.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
              No demo requests found
            </div>
          )}
        </div>
      )}

      {/* Tab: Demo Codes */}
      {activeTab === 'codes' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Uses</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Active</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Expires</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-bold" style={{ color: 'var(--accent-primary)' }}>{code.code}</span>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {demoTypeLabel(code.demo_type)}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {code.email}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {code.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {code.uses_count} / {code.max_uses}
                    </td>
                    <td className="px-6 py-4">
                      {code.is_active ? (
                        <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-green-500/15 text-green-500">Active</span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-500/15 text-red-500">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(code.expires_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(code)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg transition"
                          style={{
                            backgroundColor: code.is_active ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                            color: code.is_active ? '#ef4444' : '#22c55e',
                          }}
                        >
                          {code.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                        <button
                          onClick={() => handleCopyCode(code.code, code.id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg transition"
                          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                        >
                          {copiedCodeId === code.id ? 'Copied!' : 'Copy Code'}
                        </button>
                        <button
                          onClick={() => handleDeleteCode(code.id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {codes.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
              No demo codes found
            </div>
          )}
        </div>
      )}

      {/* Tab: Generate Code */}
      {activeTab === 'generate' && (
        <div className="max-w-xl">
          <div className="rounded-xl p-8" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Generate Demo Code</h2>
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={generateForm.email}
                  onChange={(e) => setGenerateForm({ ...generateForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={generateForm.name}
                  onChange={(e) => setGenerateForm({ ...generateForm, name: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Demo Type */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Demo Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={generateForm.demo_type}
                  onChange={(e) => setGenerateForm({ ...generateForm, demo_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="user">User Demo</option>
                  <option value="store">Store Demo</option>
                  <option value="both">Both</option>
                </select>
              </div>

              {/* Expires In */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Expires In
                </label>
                <select
                  value={generateForm.expires_days}
                  onChange={(e) => setGenerateForm({ ...generateForm, expires_days: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generateLoading || !generateForm.email}
                className="w-full px-6 py-3 rounded-lg font-bold text-black bg-green-500 hover:bg-green-600 transition disabled:opacity-50"
              >
                {generateLoading ? 'Generating...' : 'Generate Code'}
              </button>
            </form>

            {/* Generated Code Display */}
            {generatedCode && (
              <div className="mt-8 p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-primary)', border: '2px solid var(--accent-primary)' }}>
                <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Generated Demo Code</div>
                <div className="text-3xl font-mono font-black tracking-widest" style={{ color: 'var(--accent-primary)' }}>
                  {generatedCode}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode)
                  }}
                  className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg transition"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Request Modal */}
      {viewModal.open && viewModal.request && (() => {
        const req = viewModal.request
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            onClick={() => setViewModal({ open: false, request: null })}
          >
            <div
              className="rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Demo Request</h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Submitted {formatDate(req.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(req.status)}
                  <button
                    onClick={() => setViewModal({ open: false, request: null })}
                    className="p-1 rounded-lg transition hover:opacity-70"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Full Name</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{req.name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Email</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{req.email}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Business Name</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{req.business_name || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Business Type</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{businessTypeLabel(req.business_type) || '-'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Interest</div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{demoTypeLabel(req.interest) || '-'}</div>
                </div>

                {req.message && (
                  <div>
                    <div className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Message</div>
                    <div
                      className="text-sm rounded-lg p-3"
                      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    >
                      {req.message}
                    </div>
                  </div>
                )}

                {req.status === 'rejected' && req.rejection_reason && (
                  <div>
                    <div className="text-xs font-semibold uppercase mb-1 text-red-400">Rejection Reason</div>
                    <div
                      className="text-sm rounded-lg p-3"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--text-primary)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                    >
                      {req.rejection_reason}
                    </div>
                  </div>
                )}

                {req.reviewed_at && (
                  <div>
                    <div className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Reviewed</div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(req.reviewed_at)}</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                {req.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setViewModal({ open: false, request: null })
                        setApproveModal({ open: true, request: req })
                        setApproveDemoType('both')
                      }}
                      className="flex-1 px-4 py-3 rounded-lg font-bold text-black bg-green-500 hover:bg-green-600 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setViewModal({ open: false, request: null })
                        setRejectModal({ open: true, request: req })
                        setRejectReason('')
                      }}
                      className="flex-1 px-4 py-3 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setViewModal({ open: false, request: null })}
                  className="flex-1 px-4 py-3 rounded-lg font-semibold transition"
                  style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Approve Modal */}
      {approveModal.open && approveModal.request && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setApproveModal({ open: false, request: null })}
        >
          <div
            className="rounded-2xl max-w-md w-full p-8"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Approve Demo Request</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Approve request from <strong style={{ color: 'var(--text-primary)' }}>{approveModal.request.name || approveModal.request.email}</strong> and generate a demo code.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Demo Type</label>
              <div className="space-y-3">
                {[
                  { value: 'user', label: 'User Demo' },
                  { value: 'store', label: 'Store Demo' },
                  { value: 'both', label: 'Both (User + Store)' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition"
                    style={{
                      backgroundColor: approveDemoType === option.value ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-primary)',
                      border: approveDemoType === option.value ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid var(--border-color)',
                    }}
                  >
                    <input
                      type="radio"
                      name="approve_demo_type"
                      value={option.value}
                      checked={approveDemoType === option.value}
                      onChange={() => setApproveDemoType(option.value)}
                      className="accent-green-500"
                    />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setApproveModal({ open: false, request: null })}
                className="flex-1 px-4 py-3 rounded-lg font-semibold transition"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 rounded-lg font-bold text-black bg-green-500 hover:bg-green-600 transition disabled:opacity-50"
              >
                {actionLoading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && rejectModal.request && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setRejectModal({ open: false, request: null })}
        >
          <div
            className="rounded-2xl max-w-md w-full p-8"
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Reject Demo Request</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Provide a reason for rejecting the request from <strong style={{ color: 'var(--text-primary)' }}>{rejectModal.request.name || rejectModal.request.email}</strong>.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />

            <div className="flex gap-4">
              <button
                onClick={() => setRejectModal({ open: false, request: null })}
                className="flex-1 px-4 py-3 rounded-lg font-semibold transition"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 px-4 py-3 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
