'use client'

import { useState } from 'react'
import { Webhook, Plus, Copy, MoreVertical, Check, X } from 'lucide-react'
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-1">
            Configure webhook endpoints to receive real-time payment notifications
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Endpoint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Webhook Endpoint</DialogTitle>
              <DialogDescription>
                Create a new webhook endpoint to receive payment event notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/webhooks/payment"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Events to listen</Label>
                <div className="space-y-2 mt-2">
                  {availableEvents.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.id}
                        checked={formData.events.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                      />
                      <label
                        htmlFor={event.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.url || formData.events.length === 0 || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Endpoint'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <p className="text-muted-foreground">Loading webhooks...</p>
            </div>
          </CardContent>
        </Card>
      ) : !webhooks || webhooks.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Webhook className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">No webhook endpoints configured</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Add an endpoint to start receiving payment notifications
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{webhook.url}</CardTitle>
                      <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                        {webhook.isActive ? (
                          <><Check className="w-3 h-3 mr-1" /> Active</>
                        ) : (
                          <><X className="w-3 h-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                    </div>
                    <CardDescription>
                      Webhook ID: {webhook.id}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-2"
                        onClick={() => copyToClipboard(webhook.id, webhook.id)}
                      >
                        {copiedId === webhook.id ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          updateMutation.mutate({
                            id: webhook.id,
                            isActive: !webhook.isActive
                          })
                        }
                      >
                        {webhook.isActive ? 'Disable' : 'Enable'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this webhook?')) {
                            deleteMutation.mutate({ id: webhook.id })
                          }
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-sm font-medium mb-2">Listening to events:</p>
                  <div className="flex flex-wrap gap-2">
                    {(webhook.events as string[]).map((event) => (
                      <Badge key={event} variant="outline">
                        {event}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Created on {new Date(webhook.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
