'use client'

import { useEffect, useState } from 'react'

interface AIModel {
  id: string
  name: string
  provider: string
  version: string
  useCase: string
  icon: string
  apiKeyConfigured: boolean
  requests24h: number
  avgResponseTime: number | null
  status: 'active' | 'inactive' | 'error'
}

export default function AIModelsPage() {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [showApiConfig, setShowApiConfig] = useState(false)
  const [apiKeys, setApiKeys] = useState({
    deepseek: '',
    openai: '',
  })
  const [saving, setSaving] = useState(false)
  const [testingModel, setTestingModel] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, {
    success: boolean
    message: string
    details?: any
    responseTime?: string
    tokens?: { input: number; output: number }
    cost?: number
  }>>({})

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    setLoading(true)
    try {
      // Check API key status
      const configResponse = await fetch('/api/admin/save-api-keys')
      const configData = await configResponse.json()

      // Get usage stats (if available)
      const usageResponse = await fetch('/api/admin/ai-usage-stats')
      let usageData = { deepseek: { requests24h: 0, avgResponseTime: null }, openai: { requests24h: 0, avgResponseTime: null } }
      try {
        const usageRes = await usageResponse
        if (usageRes.ok) {
          usageData = await usageRes.json()
        }
      } catch {
        // Usage stats not available
      }

      setModels([
        {
          id: 'deepseek-product-matcher',
          name: 'Product Matcher',
          provider: 'DeepSeek',
          version: 'deepseek-chat',
          useCase: 'Match user input to products',
          icon: '',
          apiKeyConfigured: configData.deepseekConfigured || false,
          requests24h: usageData.deepseek?.requests24h || 0,
          avgResponseTime: usageData.deepseek?.avgResponseTime || null,
          status: configData.deepseekConfigured ? 'active' : 'inactive',
        },
        {
          id: 'openai-receipt-ocr',
          name: 'Receipt OCR',
          provider: 'OpenAI',
          version: 'gpt-4-vision',
          useCase: 'Extract text from receipts',
          icon: '',
          apiKeyConfigured: configData.openaiConfigured || false,
          requests24h: usageData.openai?.requests24h || 0,
          avgResponseTime: usageData.openai?.avgResponseTime || null,
          status: configData.openaiConfigured ? 'active' : 'inactive',
        },
      ])
    } catch (error) {
      console.error('Error loading models:', error)
      // Set default models
      setModels([
        {
          id: 'deepseek-product-matcher',
          name: 'Product Matcher',
          provider: 'DeepSeek',
          version: 'deepseek-chat',
          useCase: 'Match user input to products',
          icon: '',
          apiKeyConfigured: false,
          requests24h: 0,
          avgResponseTime: null,
          status: 'inactive',
        },
        {
          id: 'openai-receipt-ocr',
          name: 'Receipt OCR',
          provider: 'OpenAI',
          version: 'gpt-4-vision',
          useCase: 'Extract text from receipts',
          icon: '',
          apiKeyConfigured: false,
          requests24h: 0,
          avgResponseTime: null,
          status: 'inactive',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveApiKeys = async () => {
    if (!apiKeys.deepseek && !apiKeys.openai) {
      alert('Please enter at least one API key')
      return
    }

    // Clean and validate keys
    let cleanedDeepseek = apiKeys.deepseek ? apiKeys.deepseek.trim() : ''
    let cleanedOpenai = apiKeys.openai ? apiKeys.openai.trim() : ''

    // Remove "Julyu " prefix if present
    if (cleanedDeepseek.toLowerCase().startsWith('julyu ')) {
      cleanedDeepseek = cleanedDeepseek.substring(6).trim()
    }
    if (cleanedOpenai.toLowerCase().startsWith('julyu ')) {
      cleanedOpenai = cleanedOpenai.substring(6).trim()
    }

    // Validate DeepSeek key format if provided
    if (cleanedDeepseek) {
      if (!cleanedDeepseek.startsWith('sk-') || cleanedDeepseek.length < 20) {
        alert(`Invalid DeepSeek API key format. Keys should start with "sk-" and be at least 20 characters.\n\nYour key starts with: "${cleanedDeepseek.substring(0, 10)}"`)
        return
      }
    }

    // Validate OpenAI key format if provided
    if (cleanedOpenai && (!cleanedOpenai.startsWith('sk-') || cleanedOpenai.length < 20)) {
      alert('Invalid OpenAI API key format. Keys should start with "sk-" and be at least 20 characters.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/save-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deepseek: cleanedDeepseek || null,
          openai: cleanedOpenai || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('API keys saved successfully!')
        setShowApiConfig(false)
        setApiKeys({ deepseek: '', openai: '' })
        await loadModels() // Reload to show updated status
      } else {
        alert(`Failed to save API keys: ${data.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Error saving API keys:', error)
      alert(`Failed to save API keys: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async (modelId: string) => {
    setTestingModel(modelId)
    try {
      // For DeepSeek, test directly first (bypasses encryption/decryption)
      if (modelId === 'deepseek-product-matcher' && apiKeys.deepseek) {
        let cleanedKey = apiKeys.deepseek.trim()
        if (cleanedKey.toLowerCase().startsWith('julyu ')) {
          cleanedKey = cleanedKey.substring(6).trim()
        }

        // Save key first if we have it
        if (cleanedKey) {
          await fetch('/api/admin/save-api-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deepseek: cleanedKey, openai: null }),
          })
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        // Test directly first
        try {
          const directTestResponse = await fetch('/api/admin/test-key-direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: cleanedKey }),
          })
          const directTestData = await directTestResponse.json()
          
          if (directTestData.success) {
            setTestResults({
              ...testResults,
              [modelId]: {
                success: true,
                message: 'API connection successful!',
                responseTime: directTestData.responseTime || 'N/A',
                tokens: directTestData.tokens || { input: 0, output: 0 },
                cost: directTestData.cost || 0,
                details: directTestData.details,
              },
            })
            await loadModels()
            setTestingModel(null)
            return
          } else {
            setTestResults({
              ...testResults,
              [modelId]: {
                success: false,
                message: directTestData.error || 'Connection failed',
                details: directTestData.details,
              },
            })
            setTestingModel(null)
            return
          }
        } catch (directError) {
          // Continue to normal test if direct test fails
          console.warn('Direct test error, trying normal test:', directError)
        }
      }

      // Normal test connection (through encryption/decryption)
      const response = await fetch(`/api/ai/test-connection?model=${modelId}`)
      const data = await response.json()

      if (data.success) {
        setTestResults({
          ...testResults,
          [modelId]: {
            success: true,
            message: data.message || 'API connection successful!',
            responseTime: data.responseTime,
            tokens: data.tokens || { input: 0, output: 0 },
            cost: data.cost || 0,
            details: data.details,
          },
        })
        await loadModels() // Reload to update status
      } else {
        setTestResults({
          ...testResults,
          [modelId]: {
            success: false,
            message: data.error || 'Connection failed',
            details: data.details,
          },
        })
      }
    } catch (error: any) {
      console.error('Test connection error:', error)
      setTestResults({
        ...testResults,
        [modelId]: {
          success: false,
          message: error.message || 'Test failed',
        },
      })
    } finally {
      setTestingModel(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500">Loading AI models...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">AI/LLM Model Management</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
          >
            Configure API Keys
          </button>
          <button className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600">
            Model Comparison
          </button>
        </div>
      </div>

      {/* API Key Configuration Panel */}
      {showApiConfig && (
        <div className="bg-gray-900 border border-blue-500/50 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">API Key Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">DeepSeek API Key</label>
              <input
                type="text"
                value={apiKeys.deepseek}
                onChange={(e) => setApiKeys({ ...apiKeys, deepseek: e.target.value })}
                placeholder="Enter DeepSeek API key (starts with sk-)"
                className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg text-white focus:border-blue-500 focus:outline-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from <a href="https://platform.deepseek.com" target="_blank" className="text-blue-500 hover:underline">platform.deepseek.com</a>
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">OpenAI API Key</label>
              <input
                type="text"
                value={apiKeys.openai}
                onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                placeholder="Enter OpenAI API key (starts with sk-)"
                className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg text-white focus:border-blue-500 focus:outline-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from <a href="https://platform.openai.com" target="_blank" className="text-blue-500 hover:underline">platform.openai.com</a>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveApiKeys}
                disabled={saving}
                className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save API Keys'}
              </button>
              <button
                onClick={() => {
                  setShowApiConfig(false)
                  setApiKeys({ deepseek: '', openai: '' })
                }}
                className="px-6 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mt-4">
              <p className="text-sm text-green-500">
                <strong>Secure Storage:</strong> API keys are encrypted and stored securely in the database. They can be managed directly from this interface.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Model Overview */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-2xl font-bold">i</div>
          <div>
            <div className="text-xl font-bold mb-2">AI Model Overview</div>
            <div className="text-gray-400 leading-relaxed">
              Julyu uses multiple AI models for different tasks. This section tracks performance, costs, and accuracy for each model.
              Configure API keys above to enable AI features.
            </div>
          </div>
        </div>
      </div>

      {/* AI Models Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-black">
            <tr>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Model</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Use Case</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Provider</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Version</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">API Key</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Requests (24h)</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Avg Response Time</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Status</th>
              <th className="text-left p-4 text-sm text-gray-500 font-semibold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <>
                <tr key={model.id} className="border-t border-gray-800 hover:bg-black/50">
                  <td className="p-4">
                    <strong>{model.icon} {model.name}</strong>
                  </td>
                  <td className="p-4">{model.useCase}</td>
                  <td className="p-4">{model.provider}</td>
                  <td className="p-4">{model.version}</td>
                  <td className="p-4">
                    {model.apiKeyConfigured ? (
                      <span className="px-3 py-1 bg-green-500/15 text-green-500 rounded-full text-sm font-semibold">
                        ✓ Configured
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="px-3 py-1 bg-red-500/15 text-red-500 rounded-full text-sm font-semibold">
                          ✗ Not Set
                        </span>
                        <button
                          onClick={() => setShowApiConfig(true)}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Set
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-bold">{model.requests24h.toLocaleString()}</td>
                  <td className="p-4">
                    {model.avgResponseTime !== null ? `${model.avgResponseTime}ms` : '—'}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      model.status === 'active' 
                        ? 'bg-green-500/15 text-green-500' 
                        : model.status === 'error'
                        ? 'bg-red-500/15 text-red-500'
                        : 'bg-gray-500/15 text-gray-500'
                    }`}>
                      {model.status === 'active' ? 'Active' : model.status === 'error' ? 'Error' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleTestConnection(model.id)}
                      disabled={testingModel === model.id}
                      className="px-3 py-1 bg-blue-500/15 text-blue-500 rounded-lg text-sm hover:bg-blue-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testingModel === model.id ? 'Testing...' : 'Test Connection'}
                    </button>
                  </td>
                </tr>
                {testResults[model.id] && (
                  <tr className="bg-black/30">
                    <td colSpan={9} className="p-4">
                      <div className={`p-4 rounded-lg border ${
                        testResults[model.id].success
                          ? 'bg-green-500/10 border-green-500/50'
                          : 'bg-red-500/10 border-red-500/50'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className={`font-semibold mb-1 ${
                              testResults[model.id].success ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {testResults[model.id].success ? 'Test Successful' : 'Test Failed'}
                            </div>
                            <div className="text-sm text-gray-400">{testResults[model.id].message}</div>
                          </div>
                          <button
                            onClick={() => {
                              const newResults = { ...testResults }
                              delete newResults[model.id]
                              setTestResults(newResults)
                            }}
                            className="text-gray-500 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                        {testResults[model.id].success && (
                          <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <div className="text-gray-500">Response Time</div>
                              <div className="font-bold">{testResults[model.id].responseTime || 'N/A'}</div>
                            </div>
                            {testResults[model.id]?.tokens && (
                              <>
                                <div>
                                  <div className="text-gray-500">Input Tokens</div>
                                  <div className="font-bold">{testResults[model.id]?.tokens?.input?.toLocaleString() || '0'}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Output Tokens</div>
                                  <div className="font-bold">{testResults[model.id]?.tokens?.output?.toLocaleString() || '0'}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Cost</div>
                                  <div className="font-bold text-green-500">
                                    ${testResults[model.id].cost?.toFixed(6) || '0.000000'}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        {testResults[model.id].details && (
                          <div className="mt-3 text-xs text-gray-500 font-mono bg-black/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(testResults[model.id].details, null, 2)}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Matcher Details */}
      <div className="bg-gray-900 border border-purple-500/20 rounded-2xl p-8">
        <div className="text-2xl font-bold mb-6">Product Matcher (DeepSeek)</div>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-800">
            <span className="text-gray-500">Total Requests (All Time)</span>
            <span className="text-xl font-bold">0</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-800">
            <span className="text-gray-500">Matching Accuracy</span>
            <span className="text-xl font-bold text-green-500">—</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-gray-800">
            <span className="text-gray-500">Avg Tokens per Request</span>
            <span className="font-bold">Input: — | Output: —</span>
          </div>
        </div>
      </div>
    </div>
  )
}
