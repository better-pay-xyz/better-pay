'use client'

import { useState } from 'react'
import { Webhook, Plus, Copy, MoreVertical, Check, X, ShieldCheck, Loader2, Globe, Calendar, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { trpc } from '@/lib/trpc/client'

const availableEvents = [
  { id: 'payment.succeeded', label: 'Payment Succeeded' },
  { id: 'payment.failed', label: 'Payment Failed' },
  { id: 'payment.refunded', label: 'Payment Refunded' },
  { id: 'payment.cancelled', label: 'Payment Cancelled' }
] as const

type WebhookEvent = typeof availableEvents[number]['id']

export default function WebhooksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    url: '',
    events: [] as WebhookEvent[]
  })

  // tRPC queries and mutations
  const { data: webhooks, isLoading, refetch } = trpc.webhooks.list.useQuery()
  const createMutation = trpc.webhooks.create.useMutation({
    onSuccess: () => {
      refetch()
      setIsDialogOpen(false)
      setFormData({ url: '', events: [] })
    }
  })
  const updateMutation = trpc.webhooks.update.useMutation({
    onSuccess: () => refetch()
  })
  const deleteMutation = trpc.webhooks.delete.useMutation({
    onSuccess: () => refetch()
  })

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleEvent = (eventId: WebhookEvent) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }))
  }

  const handleCreate = () => {
    if (formData.events.length === 0) {
      alert('Please select at least one event')
      return
    }
    createMutation.mutate({
      url: formData.url,
      events: formData.events
    })
  }

  return (
    <div className="space-y-8 p-1 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Webhooks</h1>
          <p className="text-slate-500 font-medium">
            Receive real-time blockchain event notifications to your server.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold h-11 px-6 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Endpoint
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
              <DialogTitle className="text-2xl font-black text-slate-900">New Webhook Endpoint</DialogTitle>
              <DialogDescription className="font-medium text-slate-500">
                Configure your server to receive payment updates.
              </DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Endpoint URL *</Label>
                <div className="relative">
                  <Globe className="absolute left-4 top-3 w-4 h-4 text-slate-300" />
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://api.yourserver.com/webhooks"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="h-12 pl-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Events to Subscribe</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableEvents.map((event) => (
                    <div 
                      key={event.id} 
                      onClick={() => toggleEvent(event.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        formData.events.includes(event.id) 
                          ? 'bg-primary/5 border-primary/20 text-primary' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      <Checkbox
                        id={event.id}
                        checked={formData.events.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <span className="text-xs font-bold">{event.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50/50 border-t border-slate-100 gap-3">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.url || formData.events.length === 0 || createMutation.isPending}
                className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Create Endpoint
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Webhooks List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-40 bg-slate-50 animate-pulse rounded-[2rem]" />)}
          </div>
        ) : !webhooks || webhooks.length === 0 ? (
          <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
            <CardContent className="p-24 flex flex-col items-center text-center space-y-4">
              <div className="p-6 bg-white rounded-full w-fit mx-auto shadow-sm">
                <Webhook className="w-12 h-12 text-slate-100" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">No Webhooks Found</h3>
                <p className="text-sm text-slate-500 font-medium max-w-[300px]">
                  Add an endpoint to start listening for payment success and failure events.
                </p>
              </div>
              <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl font-bold shadow-lg shadow-primary/20">
                Add First Endpoint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id} className="group border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden rounded-[2rem]">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-primary transition-colors" />
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                          <Globe className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-xl font-black text-slate-900 tracking-tight">{webhook.url}</CardTitle>
                        <Badge variant="outline" className={`font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-sm ${
                          webhook.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {webhook.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <span>ID: {webhook.id.slice(0, 12)}...</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md hover:bg-slate-50"
                          onClick={() => copyToClipboard(webhook.id, webhook.id)}
                        >
                          {copiedId === webhook.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-300 hover:text-slate-500 transition-colors" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-50">
                          <MoreVertical className="w-5 h-5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl p-2 border-slate-100 shadow-xl">
                        <DropdownMenuItem
                          className="rounded-lg cursor-pointer font-bold text-xs"
                          onClick={() =>
                            updateMutation.mutate({
                              id: webhook.id,
                              isActive: !webhook.isActive
                            })
                          }
                        >
                          {webhook.isActive ? <X className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                          {webhook.isActive ? 'Disable Endpoint' : 'Enable Endpoint'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-lg cursor-pointer font-bold text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 mt-1"
                          onClick={() => {
                            if (confirm('Permanently delete this webhook endpoint?')) {
                              deleteMutation.mutate({ id: webhook.id })
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Webhook
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-2">
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Subscribed Events</p>
                      <div className="flex flex-wrap gap-2">
                        {(webhook.events as string[]).map((event) => (
                          <Badge key={event} variant="secondary" className="bg-slate-50 text-slate-600 border-none font-bold text-[10px] h-6 px-3">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Created {new Date(webhook.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        SSL Verified
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
