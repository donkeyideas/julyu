'use client'

import { useState, useEffect } from 'react'

interface TrainingRecord {
  id: string
  input_text: string
  output_text: string
  use_case: string
  model_name: string
  accuracy_score: number | null
  user_feedback: 'positive' | 'negative' | 'neutral' | null
  validated: boolean
  validation_notes: string | null
  created_at: string
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
  const [filters, setFilters] = useState({
    use_case: '',
    validated: '',
    feedback: ''
  })
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null)
  const [exporting, setExporting] = useState(false)

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
        setSummary(result.summary)
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

  const useCases = summary ? Object.keys(summary.byUseCase) : []

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-4xl font-black">Training Data Management</h1>
          <p className="text-gray-500 mt-2">Manage and export data for custom LLM training</p>
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
            className="px-4 py-2 border border-gray-700 rounded-lg hover:border-green-500 transition disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm text-gray-500">Total Records</div>
            <div className="text-3xl font-bold">{summary.total}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm text-gray-500">Validated</div>
            <div className="text-3xl font-bold text-green-500">{summary.validated}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm text-gray-500">Pending Review</div>
            <div className="text-3xl font-bold text-yellow-500">{summary.pending}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm text-gray-500">Positive Feedback</div>
            <div className="text-3xl font-bold text-green-500">{summary.byFeedback.positive}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-sm text-gray-500">Negative Feedback</div>
            <div className="text-3xl font-bold text-red-500">{summary.byFeedback.negative}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filters.use_case}
          onChange={(e) => { setFilters(f => ({ ...f, use_case: e.target.value })); setPage(1); }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2"
        >
          <option value="">All Use Cases</option>
          {useCases.map(uc => (
            <option key={uc} value={uc}>{uc} ({summary?.byUseCase[uc]})</option>
          ))}
        </select>

        <select
          value={filters.validated}
          onChange={(e) => { setFilters(f => ({ ...f, validated: e.target.value })); setPage(1); }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2"
        >
          <option value="">All Validation Status</option>
          <option value="true">Validated</option>
          <option value="false">Pending</option>
        </select>

        <select
          value={filters.feedback}
          onChange={(e) => { setFilters(f => ({ ...f, feedback: e.target.value })); setPage(1); }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2"
        >
          <option value="">All Feedback</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-black">
              <tr>
                <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Date</th>
                <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Use Case</th>
                <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Input Preview</th>
                <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Status</th>
                <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Feedback</th>
                <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map(record => (
                  <tr key={record.id} className="border-t border-gray-800 hover:bg-black/50">
                    <td className="p-4 text-sm">
                      {new Date(record.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-800 rounded text-sm">
                        {record.use_case || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400 max-w-xs truncate">
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
                        <span className="text-gray-500">~</span>
                      )}
                      {!record.user_feedback && (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="px-3 py-1 text-sm border border-gray-700 rounded hover:border-green-500"
                        >
                          View
                        </button>
                        <button
                          onClick={() => updateRecord(record.id, { validated: !record.validated })}
                          className={`px-3 py-1 text-sm rounded ${
                            record.validated
                              ? 'bg-gray-800 text-gray-400'
                              : 'bg-green-500 text-black'
                          }`}
                        >
                          {record.validated ? 'Unvalidate' : 'Validate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No training data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-800 flex justify-between items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-700 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-700 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Training Record Details</h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-500 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Use Case</div>
                  <div className="font-medium">{selectedRecord.use_case || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Model</div>
                  <div className="font-medium">{selectedRecord.model_name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-medium">{new Date(selectedRecord.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Accuracy Score</div>
                  <div className="font-medium">
                    {selectedRecord.accuracy_score ? `${(selectedRecord.accuracy_score * 100).toFixed(0)}%` : 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">Input</div>
                <pre className="bg-black p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                  {selectedRecord.input_text || 'N/A'}
                </pre>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">Output</div>
                <pre className="bg-black p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                  {selectedRecord.output_text || 'N/A'}
                </pre>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">Validation Notes</div>
                <textarea
                  value={selectedRecord.validation_notes || ''}
                  onChange={(e) => setSelectedRecord(prev => prev ? { ...prev, validation_notes: e.target.value } : null)}
                  placeholder="Add notes about this training record..."
                  className="w-full bg-black border border-gray-800 rounded-lg p-3 text-sm"
                  rows={3}
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateRecord(selectedRecord.id, { user_feedback: 'positive' })
                    }}
                    className={`px-4 py-2 rounded ${
                      selectedRecord.user_feedback === 'positive'
                        ? 'bg-green-500 text-black'
                        : 'bg-gray-800'
                    }`}
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
                        : 'bg-gray-800'
                    }`}
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
