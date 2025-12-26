'use client'

import { useState } from 'react'
import { Link2, Plus, Copy, MoreVertical, Check, ExternalLink, Eye, CreditCard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { trpc } from '@/lib/trpc/client'

export default function PaymentLinksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    amount: '',
    currency: 'USDC'
  })

  // tRPC queries and mutations
  const { data, isLoading, refetch } = trpc.paymentLinks.list.useQuery()
  const createMutation = trpc.paymentLinks.create.useMutation({
    onSuccess: () => {
      refetch()
      setIsDialogOpen(false)
      setFormData({ title: '', description: '', imageUrl: '', amount: '', currency: 'USDC' })
    }
  })
  const toggleActiveMutation = trpc.paymentLinks.toggleActive.useMutation({
    onSuccess: () => refetch()
  })
  const deleteMutation = trpc.paymentLinks.delete.useMutation({
    onSuccess: () => refetch()
  })

  const paymentLinks = data?.data ?? []

  const getPaymentLinkUrl = (id: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL || 'http://localhost:3002'
    return `${baseUrl}/link/${id}`
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreate = () => {
    createMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
      amount: formData.amount,
      currency: formData.currency
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Links</h1>
          <p className="text-muted-foreground mt-1">
            Create shareable payment links for your products
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Payment Link</DialogTitle>
              <DialogDescription>
                Create a new payment link to share with your customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Premium Subscription"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what customers are paying for..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="29.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="mt-1.5"
                    disabled
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.title || !formData.amount || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Links List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <p className="text-muted-foreground">Loading payment links...</p>
            </div>
          </CardContent>
        </Card>
      ) : paymentLinks.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Link2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">No payment links yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Create your first payment link to start receiving payments
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paymentLinks.map((link) => (
            <Card key={link.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {link.imageUrl && (
                      <img
                        src={link.imageUrl}
                        alt={link.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{link.title}</CardTitle>
                        <Badge variant={link.isActive ? 'default' : 'secondary'}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {link.description && (
                        <CardDescription className="mt-1">{link.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-lg font-semibold">
                          ${link.amount} {link.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={link.isActive}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: link.id, isActive: checked })
                      }
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.open(getPaymentLinkUrl(link.id), '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => copyToClipboard(getPaymentLinkUrl(link.id), link.id)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this payment link?')) {
                              deleteMutation.mutate({ id: link.id })
                            }
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{link.viewCount} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      <span>{link.paymentCount} payments</span>
                    </div>
                    <div>
                      Total: ${link.totalAmount} {link.currency}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {getPaymentLinkUrl(link.id)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(getPaymentLinkUrl(link.id), link.id)}
                    >
                      {copiedId === link.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
