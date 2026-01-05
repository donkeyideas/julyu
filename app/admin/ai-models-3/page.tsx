'use client'

import { useState } from 'react'

export default function AIModelsPage3() {
  const [deepseekKey, setDeepseekKey] = useState('sk-b438d34d8d3a43a699c787ed0caf4b2b')
  const [openaiKey, setOpenaiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)

  const handleSaveKey = async (model: 'deepseek' | 'openai') => {
    const key = model === 'deepseek' ? deepseekKey : openaiKey
    
    if (!key || key.trim() === '') {
      alert('Please enter an API key')
      return
    }

    // Remove "Julyu " prefix if present
    let cleanedKey = key.trim()
    if (cleanedKey.toLowerCase().startsWith('julyu ')) {
      cleanedKey = cleanedKey.substring(6).trim()
    }

    // Validate DeepSeek key
    if (model === 'deepseek') {
      if (!cleanedKey.startsWith('sk-')) {
        alert('Invalid DeepSeek API key format - should start with "sk-"')
        return
      }
      if (cleanedKey.length < 20) {
        alert('Invalid DeepSeek API key - too short')
        return
      }
    }

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
      if (data.success) {
        alert(`${model === 'deepseek' ? 'DeepSeek' : 'OpenAI'} API key saved successfully!`)
        if (model === 'deepseek') {
          setDeepseekKey(cleanedKey)
        } else {
          setOpenaiKey(cleanedKey)
        }
      } else {
        alert(`Failed to save API key: ${data.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async (model: 'deepseek' | 'openai') => {
    const key = model === 'deepseek' ? deepseekKey : openaiKey
    
    if (!key || key.trim() === '') {
      alert('Please enter an API key first')
      return
    }

    // Remove "Julyu " prefix if present
    let cleanedKey = key.trim()
    if (cleanedKey.toLowerCase().startsWith('julyu ')) {
      cleanedKey = cleanedKey.substring(6).trim()
    }

    setTesting(model)
    setTestResult(null)

    try {
      // Always save the key first to ensure it's in the database
      const saveResponse = await fetch('/api/admin/save-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deepseek: model === 'deepseek' ? cleanedKey : null,
          openai: model === 'openai' ? cleanedKey : null,
        }),
      })

      const saveData = await saveResponse.json()
      if (!saveData.success) {
        setTestResult({
          success: false,
          message: `Failed to save key: ${saveData.error || 'Unknown error'}`,
        })
        setTesting(null)
        return
      }

      // Wait a moment for the key to be saved
      await new Promise(resolve => setTimeout(resolve, 500))

      // Wait a bit longer for the key to be fully saved and available
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Determine model ID before type narrowing
      const modelId = model === 'deepseek' ? 'deepseek-product-matcher' : 'openai-receipt-ocr'

      // First test the key directly (bypasses encryption/decryption) - only for DeepSeek
      if (model === 'deepseek') {
        console.log('[Test] Testing key directly first...')
        console.log('[Test] Key being tested:', cleanedKey.substring(0, 20) + '...')
        try {
          const directTestResponse = await fetch('/api/admin/test-key-direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: cleanedKey }),
          })
          const directTestData = await directTestResponse.json()
          console.log('[Test] Direct test result:', directTestData)
          
          if (directTestData.success) {
            // Direct test passed - key is valid!
            setTestResult({
              success: true,
              message: 'API key is valid and working! (Direct test passed)',
              details: 'The key works directly with DeepSeek API. If the normal test fails, there may be an encryption/decryption issue.',
            })
            setTesting(null)
            return
          } else {
            setTestResult({
              success: false,
              message: directTestData.error || 'Direct API test failed',
              details: directTestData.keyPreview || directTestData.details,
            })
            setTesting(null)
            return
          }
        } catch (directError: any) {
          console.error('[Test] Direct test error:', directError)
          setTestResult({
            success: false,
            message: `Direct test error: ${directError.message}`,
          })
          setTesting(null)
          return
        }
      }

      // Then test the connection through the normal flow
      console.log('[Test] Testing connection for:', modelId)
      console.log('[Test] Saved key (first 10 chars):', cleanedKey.substring(0, 10))
      
      const response = await fetch(`/api/ai/test-connection?model=${modelId}`)
      const data = await response.json()

      console.log('[Test] Response:', data)
      console.log('[Test] Response success:', data.success)
      console.log('[Test] Response error:', data.error)

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Connection successful!',
          details: data.responseTime ? `Response time: ${data.responseTime}` : undefined,
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed',
          details: data.details ? JSON.stringify(data.details) : undefined,
        })
      }
    } catch (error: any) {
      console.error('[Test] Error:', error)
      setTestResult({
        success: false,
        message: error.message || 'Test failed - check console for details',
      })
    } finally {
      setTesting(null)
    }
  }

  return (
    <div>
      <div className="mb-10 pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-black">API Key Management & Testing</h1>
        <p className="text-gray-500 mt-2">Add and test your AI model API keys</p>
      </div>

      {/* DeepSeek API Key */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">DeepSeek API Key</h2>
            <p className="text-gray-500 text-sm">Used for product matching and semantic understanding</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">API Key</label>
            <input
              type="text"
              value={deepseekKey}
              onChange={(e) => setDeepseekKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your API key will be encrypted and stored securely
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleSaveKey('deepseek')}
              disabled={saving || !deepseekKey.trim()}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Key'}
            </button>
            <button
              onClick={() => handleTestConnection('deepseek')}
              disabled={testing === 'deepseek' || !deepseekKey.trim()}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {testResult.details && (
                <div className="text-xs mt-2 opacity-75">{testResult.details}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* OpenAI API Key */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">OpenAI API Key</h2>
            <p className="text-gray-500 text-sm">Used for receipt OCR and image processing</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">API Key</label>
            <input
              type="text"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your API key will be encrypted and stored securely
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleSaveKey('openai')}
              disabled={saving || !openaiKey.trim()}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Key'}
            </button>
            <button
              onClick={() => handleTestConnection('openai')}
              disabled={testing === 'openai' || !openaiKey.trim()}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {testResult.details && (
                <div className="text-xs mt-2 opacity-75">{testResult.details}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Info */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-2xl font-bold">i</div>
          <div>
            <div className="text-lg font-bold mb-2">How It Works</div>
            <div className="text-gray-400 text-sm space-y-2">
              <p>1. Enter your API key in the field above</p>
              <p>2. Click &quot;Save Key&quot; to encrypt and store it securely</p>
              <p>3. Click &quot;Test Connection&quot; to verify the key works</p>
              <p>4. The key will be used automatically by the AI models</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

