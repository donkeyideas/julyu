'use client'

import { useState, useEffect } from 'react'

interface TrainingRecord {
  id: string
  input_text: string
  actual_output: string
  use_case: string
  model_name: string
  accuracy_score: number | null
  user_feedback: 'positive' | 'negative' | 'neutral' | null
  validated: boolean
  validation_notes: string | null
  created_at: string
  metadata?: Record<string, unknown>
}

interface Summary {
  total: number
  validated: number
  pending: number
  byUseCase: Record<string, number>
  byFeedback: {
    positive: number
    negative: number
    neutral: number
  }
}

export default function AITrainingPage() {
  const [data, setData] = useState<TrainingRecord[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [filters, setFilters] = useState({
    use_case: '',
    validated: '',
    feedback: ''
  })
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [bulkProcessing, setBulkProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [page, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.use_case && { use_case: filters.use_case }),
        ...(filters.validated && { validated: filters.validated }),
        ...(filters.feedback && { feedback: filters.feedback })
      })

      const response = await fetch(`/api/admin/training-data?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
        setTotalPages(result.pagination.totalPages)
        setTotalRecords(result.pagination.total)
        setSummary(result.summary)
        setSelectedIds(new Set()) // Clear selection on page change
      }
    } catch (error) {
      console.error('Failed to load training data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateRecord = async (id: string, updates: Partial<TrainingRecord>) => {
    try {
      const response = await fetch('/api/admin/training-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })

      if (response.ok) {
        setData(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
        if (selectedRecord?.id === id) {
          setSelectedRecord(prev => prev ? { ...prev, ...updates } : null)
        }
      }
    } catch (error) {
      console.error('Failed to update record:', error)
    }
  }

  const deleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this training record?')) return

    try {
      const response = await fetch(`/api/admin/training-data?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setData(prev => prev.filter(r => r.id !== id))
        setSelectedRecord(null)
      }
    } catch (error) {
      console.error('Failed to delete record:', error)
    }
  }

  const exportData = async (format: 'jsonl' | 'csv' | 'json') => {
    setExporting(true)
    try {
      const response = await fetch('/api/admin/training-data/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          use_case: filters.use_case || undefined,
          validated_only: filters.validated === 'true',
          format
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const filename = response.headers.get('Content-Disposition')?.split('filename="')[1]?.replace('"', '') ||
          `training-data.${format}`

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export data:', error)
    } finally {
      setExporting(false)
    }
  }

  // Bulk validate selected records
  const bulkValidate = async (validated: boolean) => {
    if (selectedIds.size === 0) return
    setBulkProcessing(true)
    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch('/api/admin/training-data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, validated })
        })
      )
      await Promise.all(promises)
      setData(prev => prev.map(r => selectedIds.has(r.id) ? { ...r, validated } : r))
      setSelectedIds(new Set())
      loadData() // Refresh to update summary stats
    } catch (error) {
      console.error('Bulk validation failed:', error)
    } finally {
      setBulkProcessing(false)
    }
  }

  // Bulk delete selected records
  const bulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} record(s)?`)) return
    setBulkProcessing(true)
    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/admin/training-data?id=${id}`, { method: 'DELETE' })
      )
      await Promise.all(promises)
      setData(prev => prev.filter(r => !selectedIds.has(r.id)))
      setSelectedIds(new Set())
      loadData()
    } catch (error) {
      console.error('Bulk delete failed:', error)
    } finally {
      setBulkProcessing(false)
    }
  }

  // Auto-validate: Validate all records with positive feedback (server-side bulk operation)
  const autoValidatePositive = async () => {
    if (!confirm('This will validate ALL records with positive user feedback. Continue?')) return
    setBulkProcessing(true)
    try {
      const response = await fetch('/api/admin/training-data/bulk-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: 'positive_feedback' })
      })
      if (response.ok) {
        const result = await response.json()
        alert(`Auto-validated ${result.count} records with positive feedback`)
        loadData()
      }
    } catch (error) {
      console.error('Auto-validate failed:', error)
    } finally {
      setBulkProcessing(false)
    }
  }

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Select all on current page
  const selectAllOnPage = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.map(r => r.id)))
    }
  }

  const useCases = summary ? Object.keys(summary.byUseCase) : []

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>Training Data Management</h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Manage and export data for custom LLM training</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportData('jsonl')}
            disabled={exporting}
            className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export JSONL'}
          </button>
          <button
            onClick={() => exportData('csv')}
            disabled={exporting}
            className="px-4 py-2 rounded-lg hover:border-green-500 transition disabled:opacity-50"
            style={{ border: '1px solid var(--border-color)' }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Records</div>
            <div className="text-3xl font-bold">{summary.total}</div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Validated</div>
            <div className="text-3xl font-bold text-green-500">{summary.validated}</div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Pending Review</div>
            <div className="text-3xl font-bold text-yellow-500">{summary.pending}</div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Positive Feedback</div>
            <div className="text-3xl font-bold text-green-500">{summary.byFeedback.positive}</div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Negative Feedback</div>
            <div className="text-3xl font-bold text-red-500">{summary.byFeedback.negative}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={filters.use_case}
          onChange={(e) => { setFilters(f => ({ ...f, use_case: e.target.value })); setPage(1); }}
          className="rounded-lg px-4 py-2"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="">All Use Cases</option>
          {useCases.map(uc => (
            <option key={uc} value={uc}>{uc} ({summary?.byUseCase[uc]})</option>
          ))}
        </select>

        <select
          value={filters.validated}
          onChange={(e) => { setFilters(f => ({ ...f, validated: e.target.value })); setPage(1); }}
          className="rounded-lg px-4 py-2"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="">All Validation Status</option>
          <option value="true">Validated</option>
          <option value="false">Pending</option>
        </select>

        <select
          value={filters.feedback}
          onChange={(e) => { setFilters(f => ({ ...f, feedback: e.target.value })); setPage(1); }}
          className="rounded-lg px-4 py-2"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        >
          <option value="">All Feedback</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold">Bulk Actions:</span>
          {selectedIds.size > 0 && (
            <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-sm">
              {selectedIds.size} selected
            </span>
          )}
        </div>

        <button
          onClick={() => bulkValidate(true)}
          disabled={selectedIds.size === 0 || bulkProcessing}
          className="px-3 py-1.5 text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: selectedIds.size > 0 ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: selectedIds.size > 0 ? 'black' : 'var(--text-muted)' }}
        >
          Validate Selected
        </button>

        <button
          onClick={() => bulkValidate(false)}
          disabled={selectedIds.size === 0 || bulkProcessing}
          className="px-3 py-1.5 text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
        >
          Unvalidate Selected
        </button>

        <button
          onClick={bulkDelete}
          disabled={selectedIds.size === 0 || bulkProcessing}
          className="px-3 py-1.5 text-sm rounded-lg text-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500/10"
          style={{ border: '1px solid var(--border-color)' }}
        >
          Delete Selected
        </button>

        <div className="h-6 w-px" style={{ backgroundColor: 'var(--border-color)' }} />

        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Auto-Validate:</span>

        <button
          onClick={autoValidatePositive}
          disabled={bulkProcessing || (summary?.byFeedback.positive || 0) === 0}
          className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
        >
          All Positive Feedback ({summary?.byFeedback.positive || 0})
        </button>

        {bulkProcessing && (
          <span className="text-sm text-yellow-500 animate-pulse">Processing...</span>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>Loading...</div>
        ) : (
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <tr>
                <th className="text-left p-4">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.size === data.length}
                    onChange={selectAllOnPage}
                    className="w-4 h-4 rounded border-gray-500 accent-green-500 cursor-pointer"
                    title="Select all on page"
                  />
                </th>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Date</th>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Use Case</th>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Input Preview</th>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Feedback</th>
                <th className="text-left p-4 text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map(record => (
                  <tr key={record.id} style={{ borderTop: '1px solid var(--border-color)' }} className="hover:opacity-80 transition">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(record.id)}
                        onChange={() => toggleSelect(record.id)}
                        className="w-4 h-4 rounded border-gray-500 accent-green-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 text-sm">
                      {new Date(record.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded text-sm" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        {record.use_case || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-sm max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {record.input_text?.substring(0, 100) || 'N/A'}...
                    </td>
                    <td className="p-4">
                      {record.validated ? (
                        <span className="px-2 py-1 bg-green-500/15 text-green-500 rounded text-sm">Validated</span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-500/15 text-yellow-500 rounded text-sm">Pending</span>
                      )}
                    </td>
                    <td className="p-4">
                      {record.user_feedback === 'positive' && (
                        <span className="text-green-500">+</span>
                      )}
                      {record.user_feedback === 'negative' && (
                        <span className="text-red-500">-</span>
                      )}
                      {record.user_feedback === 'neutral' && (
                        <span style={{ color: 'var(--text-muted)' }} className="500">~</span>
                      )}
                      {!record.user_feedback && (
                        <span style={{ color: 'var(--text-muted)' }} className="600">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="px-3 py-1 text-sm rounded hover:border-green-500"
                          style={{ border: '1px solid var(--border-color)' }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => updateRecord(record.id, { validated: !record.validated })}
                          className={`px-3 py-1 text-sm rounded ${
                            record.validated
                              ? ''
                              : 'bg-green-500 text-black'
                          }`}
                          style={record.validated ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' } : {}}
                        >
                          {record.validated ? 'Unvalidate' : 'Validate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                    No training data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded disabled:opacity-50"
              style={{ border: '1px solid var(--border-color)' }}
            >
              Previous
            </button>
            <span style={{ color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded disabled:opacity-50"
              style={{ border: '1px solid var(--border-color)' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Training Record Details</h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Use Case</div>
                  <div className="font-medium">{selectedRecord.use_case || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Model</div>
                  <div className="font-medium">{selectedRecord.model_name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Created</div>
                  <div className="font-medium">{new Date(selectedRecord.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Accuracy Score</div>
                  <div className="font-medium">
                    {selectedRecord.accuracy_score ? `${(selectedRecord.accuracy_score * 100).toFixed(0)}%` : 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Input</div>
                <pre className="p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  {selectedRecord.input_text || 'N/A'}
                </pre>
              </div>

              <div>
                <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Output</div>
                <pre className="p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  {selectedRecord.actual_output || 'N/A'}
                </pre>
              </div>

              <div>
                <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Validation Notes</div>
                <textarea
                  value={selectedRecord.validation_notes || ''}
                  onChange={(e) => setSelectedRecord(prev => prev ? { ...prev, validation_notes: e.target.value } : null)}
                  placeholder="Add notes about this training record..."
                  className="w-full rounded-lg p-3 text-sm"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  rows={3}
                />
              </div>

              <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateRecord(selectedRecord.id, { user_feedback: 'positive' })
                    }}
                    className={`px-4 py-2 rounded ${
                      selectedRecord.user_feedback === 'positive'
                        ? 'bg-green-500 text-black'
                        : ''
                    }`}
                    style={selectedRecord.user_feedback !== 'positive' ? { backgroundColor: 'var(--bg-secondary)' } : {}}
                  >
                    + Good
                  </button>
                  <button
                    onClick={() => {
                      updateRecord(selectedRecord.id, { user_feedback: 'negative' })
                    }}
                    className={`px-4 py-2 rounded ${
                      selectedRecord.user_feedback === 'negative'
                        ? 'bg-red-500 text-white'
                        : ''
                    }`}
                    style={selectedRecord.user_feedback !== 'negative' ? { backgroundColor: 'var(--bg-secondary)' } : {}}
                  >
                    - Bad
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => deleteRecord(selectedRecord.id)}
                    className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      updateRecord(selectedRecord.id, {
                        validated: !selectedRecord.validated,
                        validation_notes: selectedRecord.validation_notes
                      })
                    }}
                    className="px-4 py-2 bg-green-500 text-black font-semibold rounded hover:bg-green-600"
                  >
                    {selectedRecord.validated ? 'Unvalidate' : 'Mark as Validated'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
