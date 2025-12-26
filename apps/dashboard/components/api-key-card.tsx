'use client'

import { useState } from 'react'
import { Eye, EyeOff, Copy, Trash2, Check } from 'lucide-react'

export interface ApiKey {
  id: string
  name: string
  environment: 'test' | 'live'
  key: string
  createdAt: string
  lastUsedAt: string | null
}

interface ApiKeyCardProps {
  apiKey: ApiKey
  onDelete: (id: string) => void
}

export function ApiKeyCard({ apiKey, onDelete }: ApiKeyCardProps) {
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const maskedKey = apiKey.key.slice(0, 7) + '...' + apiKey.key.slice(-4)

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Name and environment badge */}
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">{apiKey.name}</h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                apiKey.environment === 'live'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {apiKey.environment === 'live' ? 'Live' : 'Test'}
            </span>
          </div>

          {/* Key display */}
          <div className="mt-4 flex items-center gap-3">
            <code className="px-3 py-2 bg-gray-100 rounded-md text-sm font-mono text-gray-700">
              {showKey ? apiKey.key : maskedKey}
            </code>
            <button
              onClick={() => setShowKey(!showKey)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={handleCopy}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Copy key"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Dates */}
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
            <span>Created: {formatDate(apiKey.createdAt)}</span>
            <span>Last used: {formatDate(apiKey.lastUsedAt)}</span>
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(apiKey.id)}
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete key"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
