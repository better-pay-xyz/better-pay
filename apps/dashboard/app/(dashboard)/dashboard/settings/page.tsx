'use client'

import { useState } from 'react'
import { Save, Check, Building2, Mail, Wallet, Shield, Globe, Loader2 } from 'lucide-react'
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
  const [isSaving, setIsSaving] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    // Mock save operation
    setTimeout(() => {
      setIsSaving(false)
      setIsSaved(true)
      setTimeout(() => {
        setIsSaved(false)
      }, 2000)
    }, 1000)
  }

  return (
    <div className="space-y-8 p-1 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 font-medium">
          Manage your business profile and global payment configuration.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Business Information Section */}
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">Business Profile</CardTitle>
                  <CardDescription className="font-medium text-slate-500">How your business appears to customers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Business Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-3 w-4 h-4 text-slate-300" />
                    <Input
                      id="businessName"
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="h-12 pl-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Support Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3 w-4 h-4 text-slate-300" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings Section */}
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">Payment Routing</CardTitle>
                  <CardDescription className="font-medium text-slate-500">Configure where you receive crypto payments</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tempoAddress" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Settlement Address (Tempo)</Label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-3 w-4 h-4 text-slate-300" />
                  <Input
                    id="tempoAddress"
                    type="text"
                    required
                    value={tempoAddress}
                    onChange={(e) => setTempoAddress(e.target.value)}
                    placeholder="0x..."
                    className="h-12 pl-11 font-mono text-sm rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                  />
                </div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-2 ml-1 flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  Payments are non-custodial and sent directly here.
                </p>
              </div>

              <div className="p-6 bg-slate-900 rounded-[1.5rem] flex items-start gap-4 border border-white/5 shadow-xl">
                <div className="pt-1">
                  <Checkbox
                    id="sponsorGasFees"
                    checked={sponsorGasFees}
                    onCheckedChange={(checked) => setSponsorGasFees(checked as boolean)}
                    className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-white rounded-md w-5 h-5"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="sponsorGasFees"
                    className="text-sm font-black text-white cursor-pointer"
                  >
                    Sponsor Network Fees
                  </Label>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Provide a gasless experience for your customers. Fees will be deducted automatically from your settlement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhooks Section */}
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">Global Webhook</CardTitle>
                  <CardDescription className="font-medium text-slate-500">Legacy fallback for payment notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Endpoint URL</Label>
                <div className="relative">
                  <Globe className="absolute left-4 top-3 w-4 h-4 text-slate-300" />
                  <Input
                    id="webhookUrl"
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://yourdomain.com/webhooks"
                    className="h-12 pl-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden sticky top-24">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Save className="w-32 h-32" />
            </div>
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-black">Publish Changes</CardTitle>
              <CardDescription className="text-slate-400 font-medium pt-2">
                Updating your settings will take effect immediately across all active payment links.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <Button 
                type="submit" 
                disabled={isSaving || isSaved} 
                className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : isSaved ? (
                  <Check className="w-5 h-5 mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                {isSaving ? 'Updating...' : isSaved ? 'Saved!' : 'Save All Settings'}
              </Button>
              <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest">
                Last updated: Just now
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
