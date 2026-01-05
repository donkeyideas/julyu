'use client'

import { useState, useEffect } from 'react'

export default function AIModelsPage() {
  const [deepseekKey, setDeepseekKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)
  const [apiKeyStatus, setApiKeyStatus] = useState({ deepseek: false, openai: false })

  const loadApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/admin/save-api-keys')
      const data = await response.json()
      setApiKeyStatus({
        deepseek: data.deepseekConfigured || false,
        openai: data.openaiConfigured || false,
      })
    } catch (error) {
      console.error('Error loading API key status:', error)
    }
  }

  useEffect(() => {
    loadApiKeyStatus()
  }, [])

  const handleSaveKey = async (model: 'deepseek' | 'openai') => {
    const key = model === 'deepseek' ? deepseekKey : openaiKey
    
    if (!key || key.trim() === '') {
      alert('Please enter an API key')
      return
    }

    let cleanedKey = key.trim()
    if (cleanedKey.toLowerCase().startsWith('julyu ')) {
      cleanedKey = cleanedKey.substring(6).trim()
    }

    if (model === 'deepseek') {
      if (!cleanedKey.startsWith('sk-')) {
        alert(`Invalid DeepSeek API key format - should start with "sk-" but starts with "${cleanedKey.substring(0, 3)}"`)
        return
      }
      if (cleanedKey.length < 20) {
        alert('Invalid DeepSeek API key - too short')
        return
      }
    }

    if (model === 'openai') {
      if (!cleanedKey.startsWith('sk-')) {
        alert(`Invalid OpenAI API key format - should start with "sk-"`)
        return
      }
      if (cleanedKey.length < 20) {
        alert('Invalid OpenAI API key - too short')
        return
      }
    }

    console.log('[Save] Saving key for', model, 'length:', cleanedKey.length, 'starts with:', cleanedKey.substring(0, 10))

    setSaving(true)
    try {
      const response = await fetch('/api/admin/save-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deepseek: model === 'deepseek' ? cleanedKey : null,
          openai: model === 'openai' ? cleanedKey : null,
        }),
      })

      const data = await response.json()
      console.log('[Save] Response:', data)
      
      if (data.success) {
        alert(`${model === 'deepseek' ? 'DeepSeek' : 'OpenAI'} API key saved successfully!`)
        if (model === 'deepseek') {
          setDeepseekKey('')
        } else {
          setOpenaiKey('')
        }
        await loadApiKeyStatus()
      } else {
        alert(`Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('[Save] Error:', error)
      alert(`Error: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async (model: 'deepseek' | 'openai') => {
    const key = model === 'deepseek' ? deepseekKey : openaiKey
    let keyToTest = key.trim()
    
    // If no key entered, we can't test
    if (!keyToTest || keyToTest === '') {
      if (!apiKeyStatus[model]) {
        alert('Please enter an API key first, then save it before testing')
        return
      }
      // Key is saved, test with saved key
      keyToTest = '' // Will use saved key from database
    } else {
      // Clean the key
      if (keyToTest.toLowerCase().startsWith('julyu ')) {
        keyToTest = keyToTest.substring(6).trim()
      }
      
      // Validate before testing
      if (!keyToTest.startsWith('sk-')) {
        alert(`Invalid API key format - should start with "sk-" but starts with "${keyToTest.substring(0, 3)}"`)
        return
      }
      
      // Save the key first
      console.log('[Test] Saving key before testing...')
      await handleSaveKey(model)
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    setTesting(model)
    setTestResult(null)

    try {
      // Always test directly first (bypasses encryption issues)
      if (keyToTest && model === 'deepseek') {
        console.log('[Test] Testing key directly, length:', keyToTest.length, 'starts with:', keyToTest.substring(0, 10))
        
        const directTestResponse = await fetch('/api/admin/test-key-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: keyToTest }),
        })
        const directTestData = await directTestResponse.json()
        
        console.log('[Test] Direct test result:', directTestData)
        
        if (directTestData.success) {
          setTestResult({
            success: true,
            message: `API connection successful! Response time: ${directTestData.responseTime || 'N/A'}`,
            details: directTestData,
          })
          await loadApiKeyStatus()
          setTesting(null)
          return
        } else {
          setTestResult({
            success: false,
            message: directTestData.error || 'Connection failed',
            details: directTestData,
          })
          setTesting(null)
          return
        }
      }

      // Normal test (through encryption/decryption)
      const modelId = model === 'deepseek' ? 'deepseek-product-matcher' : 'openai-receipt-ocr'
      console.log('[Test] Testing through normal flow:', modelId)
      
      const response = await fetch(`/api/ai/test-connection?model=${modelId}`)
      const data = await response.json()

      console.log('[Test] Normal test result:', data)

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Connection successful!',
          details: data,
        })
        await loadApiKeyStatus()
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed',
          details: data.details,
        })
      }
    } catch (error: any) {
      console.error('[Test] Error:', error)
      setTestResult({
        success: false,
        message: error.message || 'Test failed',
      })
    } finally {
      setTesting(null)
    }
  }

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">AI Model API Keys</h1>
        <p className="text-gray-500 mt-2">Configure and test your AI model API keys</p>
      </div>

      {/* DeepSeek API Key */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">DeepSeek API Key</h2>
            <p className="text-gray-500 text-sm">Used for product matching</p>
          </div>
          <div>
            {apiKeyStatus.deepseek ? (
              <span className="px-4 py-2 bg-green-500/15 text-green-500 rounded-lg text-sm font-semibold">
                ✓ Configured
              </span>
            ) : (
              <span className="px-4 py-2 bg-red-500/15 text-red-500 rounded-lg text-sm font-semibold">
                ✗ Not Set
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">API Key</label>
            <input
              type="text"
              value={deepseekKey}
              onChange={(e) => setDeepseekKey(e.target.value)}
              placeholder={apiKeyStatus.deepseek ? "Enter new key to update" : "sk-..."}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleSaveKey('deepseek')}
              disabled={saving || !deepseekKey.trim()}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Key'}
            </button>
            <button
              onClick={() => handleTestConnection('deepseek')}
              disabled={testing === 'deepseek'}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {testing === 'deepseek' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {testResult && testing === null && (
            <div className={`p-4 rounded-lg border ${
              testResult.success
                ? 'bg-green-500/10 border-green-500/50 text-green-500'
                : 'bg-red-500/10 border-red-500/50 text-red-500'
            }`}>
              <div className="font-semibold mb-1">
                {testResult.success ? 'Success' : 'Failed'}
              </div>
              <div className="text-sm">{testResult.message}</div>
              {testResult.details && testResult.details.tokens && (
                <div className="mt-3 text-xs space-y-1">
                  <div>Input Tokens: {testResult.details.tokens.input?.toLocaleString() || 0}</div>
                  <div>Output Tokens: {testResult.details.tokens.output?.toLocaleString() || 0}</div>
                  <div>Cost: ${testResult.details.cost?.toFixed(6) || '0.000000'}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* OpenAI API Key */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">OpenAI API Key</h2>
            <p className="text-gray-500 text-sm">Used for receipt OCR</p>
          </div>
          <div>
            {apiKeyStatus.openai ? (
              <span className="px-4 py-2 bg-green-500/15 text-green-500 rounded-lg text-sm font-semibold">
                ✓ Configured
              </span>
            ) : (
              <span className="px-4 py-2 bg-red-500/15 text-red-500 rounded-lg text-sm font-semibold">
                ✗ Not Set
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">API Key</label>
            <input
              type="text"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={apiKeyStatus.openai ? "Enter new key to update" : "sk-..."}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleSaveKey('openai')}
              disabled={saving || !openaiKey.trim()}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Key'}
            </button>
            <button
              onClick={() => handleTestConnection('openai')}
              disabled={testing === 'openai'}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {testing === 'openai' ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {testResult && testing === null && (
            <div className={`p-4 rounded-lg border ${
              testResult.success
                ? 'bg-green-500/10 border-green-500/50 text-green-500'
                : 'bg-red-500/10 border-red-500/50 text-red-500'
            }`}>
              <div className="font-semibold mb-1">
                {testResult.success ? 'Success' : 'Failed'}
              </div>
              <div className="text-sm">{testResult.message}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

