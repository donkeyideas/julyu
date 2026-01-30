'use client'

import { useState, useEffect } from 'react'

export default function AIModelsPage() {
  const [deepseekKey, setDeepseekKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [krogerClientId, setKrogerClientId] = useState('')
  const [krogerClientSecret, setKrogerClientSecret] = useState('')
  const [spoonacularKey, setSpoonacularKey] = useState('')
  const [positionstackKey, setPositionstackKey] = useState('')
  const [stripeSecretKey, setStripeSecretKey] = useState('')
  const [stripePublishableKey, setStripePublishableKey] = useState('')
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null)
  const [apiKeyStatus, setApiKeyStatus] = useState({ deepseek: false, openai: false, kroger: false, spoonacular: false, positionstack: false, stripe: false })

  const loadApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/admin/save-api-keys')
      const data = await response.json()
      setApiKeyStatus({
        deepseek: data.deepseekConfigured || false,
        openai: data.openaiConfigured || false,
        kroger: data.krogerConfigured || false,
        spoonacular: data.spoonacularConfigured || false,
        positionstack: data.positionstackConfigured || false,
        stripe: data.stripeConfigured || false,
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

  const handleSavePositionstack = async () => {
    if (!positionstackKey.trim()) {
      alert('Please enter a Positionstack API key')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/save-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionstack: positionstackKey.trim(),
        }),
      })

      const data = await response.json()
      console.log('[Save] Positionstack Response:', data)

      if (data.success) {
        alert('Positionstack API key saved successfully!')
        setPositionstackKey('')
        await loadApiKeyStatus()
      } else {
        alert(`Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('[Save] Positionstack Error:', error)
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
      <div className="mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h1 className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>AI Model API Keys</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Configure and test your AI model API keys</p>
      </div>

      {/* DeepSeek API Key */}
      <div className="rounded-2xl p-8 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>DeepSeek API Key</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Used for product matching</p>
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
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>API Key</label>
            <input
              type="text"
              value={deepseekKey}
              onChange={(e) => setDeepseekKey(e.target.value)}
              placeholder={apiKeyStatus.deepseek ? "Enter new key to update" : "sk-..."}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none font-mono text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
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
      <div className="rounded-2xl p-8 mb-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>OpenAI API Key</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Used for receipt OCR</p>
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
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>API Key</label>
            <input
              type="text"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={apiKeyStatus.openai ? "Enter new key to update" : "sk-..."}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none font-mono text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
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
      <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Kroger API</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Used for real-time grocery prices (FREE)</p>
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
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Client ID</label>
            <input
              type="text"
              value={krogerClientId}
              onChange={(e) => setKrogerClientId(e.target.value)}
              placeholder={apiKeyStatus.kroger ? "Enter new Client ID to update" : "your-client-id"}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none font-mono text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Client Secret</label>
            <input
              type="password"
              value={krogerClientSecret}
              onChange={(e) => setKrogerClientSecret(e.target.value)}
              placeholder={apiKeyStatus.kroger ? "Enter new Client Secret to update" : "your-client-secret"}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none font-mono text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
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
      <div className="rounded-2xl p-8 mt-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Spoonacular API</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Used for product data, nutrition info, and price estimates</p>
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
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>API Key</label>
            <input
              type="text"
              value={spoonacularKey}
              onChange={(e) => setSpoonacularKey(e.target.value)}
              placeholder={apiKeyStatus.spoonacular ? "Enter new key to update" : "your-api-key"}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none font-mono text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
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

      {/* Positionstack API Key */}
      <div className="rounded-2xl p-8 mt-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Positionstack Geocoding API</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Converts addresses and zip codes to coordinates for accurate store searches</p>
            <a
              href="https://positionstack.com/signup/free"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm hover:underline"
            >
              Get FREE API key from positionstack.com (25,000 requests/month)
            </a>
          </div>
          <div>
            {apiKeyStatus.positionstack ? (
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
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>API Key</label>
            <input
              type="text"
              value={positionstackKey}
              onChange={(e) => setPositionstackKey(e.target.value)}
              placeholder={apiKeyStatus.positionstack ? "Enter new key to update" : "your-api-key"}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none font-mono text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSavePositionstack}
              disabled={saving || !positionstackKey.trim()}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Key'}
            </button>
          </div>

          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>Features:</strong> Address to coordinates conversion, zip code lookup, distance calculations. Required for accurate store search by address.
            </p>
            <p className="text-blue-400 text-sm mt-2">
              <strong>Without this key:</strong> System will extract zip codes from addresses and search by zip only (less accurate distances).
            </p>
          </div>
        </div>
      </div>

      {/* Stripe API Keys */}
      <div className="rounded-2xl p-8 mt-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Stripe</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Payment processing for subscriptions</p>
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm hover:underline"
            >
              Get API keys from dashboard.stripe.com
            </a>
          </div>
          <div>
            {apiKeyStatus.stripe ? (
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
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Secret Key</label>
            <input
              type="password"
              value={stripeSecretKey}
              onChange={(e) => setStripeSecretKey(e.target.value)}
              placeholder={apiKeyStatus.stripe ? "Enter new key to update" : "sk_live_... or sk_test_..."}
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none font-mono text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Publishable Key</label>
            <input
              type="text"
              value={stripePublishableKey}
              onChange={(e) => setStripePublishableKey(e.target.value)}
              placeholder="pk_live_... or pk_test_..."
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none font-mono text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Webhook Secret</label>
            <input
              type="password"
              value={stripeWebhookSecret}
              onChange={(e) => setStripeWebhookSecret(e.target.value)}
              placeholder="whsec_..."
              className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none font-mono text-sm"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={async () => {
                const hasAnyKey = stripeSecretKey.trim() || stripePublishableKey.trim() || stripeWebhookSecret.trim()
                if (!hasAnyKey) {
                  alert('Please enter at least one key to save')
                  return
                }
                setSaving(true)
                try {
                  const payload: Record<string, string | null> = {}
                  if (stripeSecretKey.trim()) payload.stripeSecretKey = stripeSecretKey.trim()
                  if (stripePublishableKey.trim()) payload.stripePublishableKey = stripePublishableKey.trim()
                  if (stripeWebhookSecret.trim()) payload.stripeWebhookSecret = stripeWebhookSecret.trim()

                  const response = await fetch('/api/admin/save-api-keys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  })
                  const data = await response.json()
                  if (data.success) {
                    alert('Stripe API keys saved successfully!')
                    setStripeSecretKey('')
                    setStripePublishableKey('')
                    setStripeWebhookSecret('')
                    await loadApiKeyStatus()
                  } else {
                    alert(`Failed to save: ${data.error || 'Unknown error'}`)
                  }
                } catch (error: any) {
                  alert(`Error: ${error.message || 'Unknown error'}`)
                } finally {
                  setSaving(false)
                }
              }}
              disabled={saving || (!stripeSecretKey.trim() && !stripePublishableKey.trim() && !stripeWebhookSecret.trim())}
              className="px-6 py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Keys'}
            </button>
          </div>

          <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
            <p className="text-indigo-400 text-sm">
              <strong>Features:</strong> Subscription billing, checkout sessions, customer portal, webhook events, promo code discounts.
            </p>
          </div>
        </div>
      </div>

      {/* Open Food Facts Prices (FREE) */}
      <div className="rounded-2xl p-8 mt-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              Open Food Facts Prices
              <span className="px-3 py-1 bg-green-500/15 text-green-500 rounded-lg text-xs font-semibold">
                FREE
              </span>
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Crowdsourced global grocery price database (168k+ prices)</p>
            <a
              href="https://prices.openfoodfacts.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm hover:underline"
            >
              Visit prices.openfoodfacts.org
            </a>
          </div>
          <div>
            <span className="px-4 py-2 bg-green-500/15 text-green-500 rounded-lg text-sm font-semibold">
              ✓ Ready to Use
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-start gap-3 mb-3">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No API Key Required</div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  This API is completely free and requires no authentication for read operations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 mb-3">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Global Coverage</div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Price data from stores worldwide including France, Spain, UK, US, and more.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="flex-1">
                <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No Rate Limits</div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Use as much as you need without worrying about overage charges or quotas.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm mb-2">
              <strong>API Endpoint:</strong> <code className="bg-black/30 px-2 py-1 rounded">https://prices.openfoodfacts.org/api</code>
            </p>
            <p className="text-blue-400 text-sm mb-2">
              <strong>Documentation:</strong> <a href="https://prices.openfoodfacts.org/api/docs" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">prices.openfoodfacts.org/api/docs</a>
            </p>
            <p className="text-blue-400 text-sm">
              <strong>License:</strong> OdBL (must credit Open Food Facts in your app)
            </p>
          </div>

          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-purple-400 text-sm">
              <strong>Dataset:</strong> 168,000+ price records available for bulk download on <a href="https://huggingface.co/datasets/openfoodfacts/open-prices" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-300">Hugging Face</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

