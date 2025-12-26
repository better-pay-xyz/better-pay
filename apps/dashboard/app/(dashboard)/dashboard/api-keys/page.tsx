'use client'

import { useState } from 'react'
import { Plus, AlertTriangle, X, Copy, Check, Key } from 'lucide-react'
import { ApiKeyCard, type ApiKey } from '@/components/api-key-card'

// Mock data for demonstration
const initialMockKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    environment: 'live',
    key: 'pk_live_51ABC123XYZ789',
    createdAt: '2024-01-15T10:30:00Z',
    lastUsedAt: '2024-12-20T14:22:00Z'
  },
  {
    id: '2',
    name: 'Development Testing',
    environment: 'test',
    key: 'pk_test_51DEF456UVW012',
    createdAt: '2024-02-20T09:15:00Z',
    lastUsedAt: '2024-12-19T11:45:00Z'
  },
  {
    id: '3',
    name: 'Mobile App Integration',
    environment: 'test',
    key: 'pk_test_51GHI789RST345',
    createdAt: '2024-03-10T16:00:00Z',
    lastUsedAt: null
  }
]

function generateApiKey(environment: 'test' | 'live'): string {
  const prefix = environment === 'live' ? 'pk_live_' : 'pk_test_'
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = prefix
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialMockKeys)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyEnvironment, setNewKeyEnvironment] = useState<'test' | 'live'>('test')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      setApiKeys(apiKeys.filter((key) => key.id !== id))
    }
  }

  function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    const newKey = generateApiKey(newKeyEnvironment)
    const newApiKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      environment: newKeyEnvironment,
      key: newKey,
      createdAt: new Date().toISOString(),
      lastUsedAt: null
    }
    setApiKeys([newApiKey, ...apiKeys])
    setGeneratedKey(newKey)
  }

  async function handleCopyAndClose() {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey)
      setCopied(true)
      setTimeout(() => {
        closeModal()
      }, 500)
    }
  }

  function closeModal() {
    setIsModalOpen(false)
    setNewKeyName('')
    setNewKeyEnvironment('test')
    setGeneratedKey(null)
    setCopied(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500 mt-1">Manage your API keys for payment integration.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Key
        </button>
      </div>

      {/* Security Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-yellow-800">Keep your API keys secure</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Never share your API keys publicly or commit them to version control. Use environment
            variables to store them securely. Rotate keys immediately if you suspect they have been
            compromised.
          </p>
        </div>
      </div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No API keys yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create an API key to start integrating with BetterPay
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <ApiKeyCard key={apiKey.id} apiKey={apiKey} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Create Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {generatedKey ? 'API Key Created' : 'Create New API Key'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {!generatedKey ? (
                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div>
                    <label htmlFor="keyName" className="block text-sm font-medium text-gray-700">
                      Key Name
                    </label>
                    <input
                      id="keyName"
                      type="text"
                      required
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API Key"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="environment"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Environment
                    </label>
                    <select
                      id="environment"
                      value={newKeyEnvironment}
                      onChange={(e) => setNewKeyEnvironment(e.target.value as 'test' | 'live')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="test">Test</option>
                      <option value="live">Live</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Test keys only work with test mode. Use live keys for production.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create API Key
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">
                          Save this key now
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          This is the only time you will be able to see this key. Copy it and store
                          it securely.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your new API key
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded-md text-sm font-mono text-gray-700 break-all">
                        {generatedKey}
                      </code>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyAndClose}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy & Close
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
