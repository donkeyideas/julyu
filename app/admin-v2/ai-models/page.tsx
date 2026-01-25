'use client'

import { useState, useEffect } from 'react'

export default function AIModelsPage() {
  const [deepseekKey, setDeepseekKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [krogerClientId, setKrogerClientId] = useState('')
  const [krogerClientSecret, setKrogerClientSecret] = useState('')
  const [spoonacularKey, setSpoonacularKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)
  const [apiKeyStatus, setApiKeyStatus] = useState({ deepseek: false, openai: false, kroger: false, spoonacular: false })

  const loadApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/admin/save-api-keys')
      const data = await response.json()
      setApiKeyStatus({
        deepseek: data.deepseekConfigured || false,
        openai: data.openaiConfigured || false,
        kroger: data.krogerConfigured || false,
        spoonacular: data.spoonacularConfigured || false,
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

  const handleSaveKroger = async () => {
    if (!krogerClientId.trim() || !krogerClientSecret.trim()) {
      alert('Please enter both Client ID and Client Secret')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/save-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          krogerClientId: krogerClientId.trim(),
          krogerClientSecret: krogerClientSecret.trim(),
        }),
      })

      const data = await response.json()
      console.log('[Save] Kroger Response:', data)

      if (data.success) {
        alert('Kroger API credentials saved successfully!')
        setKrogerClientId('')
        setKrogerClientSecret('')
        await loadApiKeyStatus()
      } else {
        alert(`Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('[Save] Kroger Error:', error)
      alert(`Error: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTestKroger = async () => {
    setTesting('kroger')
    setTestResult(null)

    try {
      // Test by trying to get an access token
      const response = await fetch('/api/kroger/stores?zipCode=45202&limit=1')
      const data = await response.json()

      if (data.success || data.stores) {
        setTestResult({
          success: true,
          message: `Connection successful! Found ${data.count || 0} stores.`,
          details: data,
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed',
          details: data,
        })
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Test failed',
      })
    } finally {
      setTesting(null)
    }
  }

  const handleSaveSpoonacular = async () => {
    if (!spoonacularKey.trim()) {
      alert('Please enter a Spoonacular API key')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/save-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spoonacular: spoonacularKey.trim(),
        }),
      })

      const data = await response.json()
      console.log('[Save] Spoonacular Response:', data)

      if (data.success) {
        alert('Spoonacular API key saved successfully!')
        setSpoonacularKey('')
        await loadApiKeyStatus()
      } else {
        alert(`Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('[Save] Spoonacular Error:', error)
      alert(`Error: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleTestSpoonacular = async () => {
    setTesting('spoonacular')
    setTestResult(null)

    try {
      const response = await fetch('/api/spoonacular/test')
      const data = await response.json()

      if (data.success) {
        setTestResult({
          success: true,
          message: `Connection successful! Found ${data.productCount || 0} products.`,
          details: data,
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed',
          details: data,
        })
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Test failed',
      })
    } finally {
      setTesting(null)
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
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
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

      {/* Kroger API Credentials */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Kroger API</h2>
            <p className="text-gray-500 text-sm">Used for real-time grocery prices (FREE)</p>
            <a
              href="https://developer.kroger.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm hover:underline"
            >
              Get API keys from developer.kroger.com
            </a>
          </div>
          <div>
            {apiKeyStatus.kroger ? (
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
            <label className="block text-sm text-gray-400 mb-2">Client ID</label>
            <input
              type="text"
              value={krogerClientId}
              onChange={(e) => setKrogerClientId(e.target.value)}
              placeholder={apiKeyStatus.kroger ? "Enter new Client ID to update" : "your-client-id"}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Client Secret</label>
            <input
              type="password"
              value={krogerClientSecret}
              onChange={(e) => setKrogerClientSecret(e.target.value)}
              placeholder={apiKeyStatus.kroger ? "Enter new Client Secret to update" : "your-client-secret"}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveKroger}
              disabled={saving || !krogerClientId.trim() || !krogerClientSecret.trim()}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Credentials'}
            </button>
            <button
              onClick={handleTestKroger}
              disabled={testing === 'kroger' || !apiKeyStatus.kroger}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {testing === 'kroger' ? 'Testing...' : 'Test Connection'}
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

          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>Supported Stores:</strong> Kroger, Fred Meyer, Ralphs, King Soopers, Fry&apos;s, Smith&apos;s, QFC, Harris Teeter, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Spoonacular API Key */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Spoonacular API</h2>
            <p className="text-gray-500 text-sm">Used for product data, nutrition info, and price estimates</p>
            <a
              href="https://spoonacular.com/food-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm hover:underline"
            >
              Get API key from spoonacular.com/food-api
            </a>
          </div>
          <div>
            {apiKeyStatus.spoonacular ? (
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
              value={spoonacularKey}
              onChange={(e) => setSpoonacularKey(e.target.value)}
              placeholder={apiKeyStatus.spoonacular ? "Enter new key to update" : "your-api-key"}
              className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg text-white focus:border-green-500 focus:outline-none font-mono text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveSpoonacular}
              disabled={saving || !spoonacularKey.trim()}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Key'}
            </button>
            <button
              onClick={handleTestSpoonacular}
              disabled={testing === 'spoonacular' || !apiKeyStatus.spoonacular}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {testing === 'spoonacular' ? 'Testing...' : 'Test Connection'}
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

          <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-purple-400 text-sm">
              <strong>Features:</strong> Grocery product search, UPC lookup, nutrition data, price estimates, product classification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

