'use client'

import { useState } from 'react'
import { Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

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
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your business information and payment settings.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Basic information about your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <CardDescription>Configure where you receive payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tempoAddress">Tempo Wallet Address</Label>
              <Input
                id="tempoAddress"
                type="text"
                required
                value={tempoAddress}
                onChange={(e) => setTempoAddress(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This is the Tempo wallet address where you will receive payments. Make sure this
                address is correct as payments sent to the wrong address cannot be recovered.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="sponsorGasFees"
                checked={sponsorGasFees}
                onCheckedChange={(checked) => setSponsorGasFees(checked as boolean)}
              />
              <div className="space-y-1 leading-none">
                <Label
                  htmlFor="sponsorGasFees"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Sponsor gas fees
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, you cover the gas fees for customer transactions, providing a
                  smoother checkout experience. Gas fees will be deducted from your received
                  payments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks Section */}
        <Card>
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>
              Receive real-time notifications about payment events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://yourdomain.com/webhooks/betterpay"
              />
              <p className="text-xs text-muted-foreground">
                We will send POST requests to this URL when payment events occur (e.g., payment
                completed, payment failed). Leave empty to disable webhooks.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaved} className="min-w-[140px]">
            {isSaved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
