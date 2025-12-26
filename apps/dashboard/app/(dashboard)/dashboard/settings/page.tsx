'use client'

import { useState } from 'react'
import { Save, Check } from 'lucide-react'

export default function SettingsPage() {
  // Business Information State
  const [businessName, setBusinessName] = useState('My Business')
  const [email, setEmail] = useState('contact@mybusiness.com')

  // Payment Settings State
  const [tempoAddress, setTempoAddress] = useState('0x1234567890abcdef1234567890abcdef12345678')
  const [sponsorGasFees, setSponsorGasFees] = useState(true)

  // Webhooks State
  const [webhookUrl, setWebhookUrl] = useState('https://mybusiness.com/webhooks/betterpay')

  // Save State
  const [isSaved, setIsSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()

    // Mock save operation
    console.log('Saving settings:', {
      businessName,
      email,
      tempoAddress,
      sponsorGasFees,
      webhookUrl
    })

    // Show success feedback
    setIsSaved(true)
    setTimeout(() => {
      setIsSaved(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your business information and payment settings.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Information Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
            <p className="text-sm text-gray-500 mt-1">
              Basic information about your business
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure where you receive payments
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="tempoAddress" className="block text-sm font-medium text-gray-700">
                Tempo Wallet Address
              </label>
              <input
                id="tempoAddress"
                type="text"
                required
                value={tempoAddress}
                onChange={(e) => setTempoAddress(e.target.value)}
                placeholder="0x..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                This is the Tempo wallet address where you will receive payments. Make sure this
                address is correct as payments sent to the wrong address cannot be recovered.
              </p>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="sponsorGasFees"
                  type="checkbox"
                  checked={sponsorGasFees}
                  onChange={(e) => setSponsorGasFees(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="sponsorGasFees" className="text-sm font-medium text-gray-700">
                  Sponsor gas fees
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  When enabled, you cover the gas fees for customer transactions, providing a
                  smoother checkout experience. Gas fees will be deducted from your received
                  payments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Webhooks Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Webhooks</h2>
            <p className="text-sm text-gray-500 mt-1">
              Receive real-time notifications about payment events
            </p>
          </div>
          <div className="p-6">
            <div>
              <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">
                Webhook URL
              </label>
              <input
                id="webhookUrl"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://yourdomain.com/webhooks/betterpay"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                We will send POST requests to this URL when payment events occur (e.g., payment
                completed, payment failed). Leave empty to disable webhooks.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaved}
          >
            {isSaved ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
