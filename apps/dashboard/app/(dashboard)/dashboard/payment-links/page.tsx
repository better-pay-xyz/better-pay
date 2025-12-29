'use client'

import { useState } from 'react'
import { Link2, Plus, Copy, MoreVertical, Check, ExternalLink, Eye, CreditCard, ShoppingBag, Loader2, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Payment Links</h1>
          <p className="text-slate-500 font-medium">Create shareable crypto payment links for anything.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
              <DialogTitle>Create Payment Link</DialogTitle>
              <DialogDescription>
                Design a custom checkout experience for your customers
              </DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Premium Subscription"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what customers are paying for..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Amount *</Label>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="29.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Currency</Label>
                  <div className="h-12 flex items-center px-4 bg-slate-100/50 rounded-xl border border-slate-100 text-slate-400 font-bold">
                    {formData.currency}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50/50 border-t border-slate-100 gap-3">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.title || !formData.amount || createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Links List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-[200px] animate-pulse bg-white/50" />
          ))}
        </div>
      ) : paymentLinks.length === 0 ? (
        <Card className="bg-white/50 backdrop-blur-sm">
          <CardContent className="p-24">
            <div className="text-center max-w-[300px] mx-auto space-y-4">
              <div className="p-6 bg-white rounded-full w-fit mx-auto shadow-sm text-slate-200">
                <Link2 className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">Ready to sell?</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Create your first link and share it on Twitter, WhatsApp, or your website.
                </p>
              </div>
              <Button onClick={() => setIsDialogOpen(true)}>
                Create First Link
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paymentLinks.map((link) => (
            <Card key={link.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col rounded-[2.5rem]">
              {/* Card Header with Image */}
              <div className="relative aspect-[16/9] bg-slate-50 overflow-hidden">
                {link.imageUrl ? (
                  <img
                    src={link.imageUrl}
                    alt={link.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-100">
                    <ShoppingBag className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-6 left-6">
                  <Badge variant={link.isActive ? 'success' : 'secondary'} className="shadow-sm backdrop-blur-md">
                    {link.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur shadow-sm">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl p-2 border-slate-100 shadow-xl">
                      <DropdownMenuItem className="rounded-lg cursor-pointer font-bold text-xs" onClick={() => window.open(getPaymentLinkUrl(link.id), '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2 text-slate-400" />
                        Open Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg cursor-pointer font-bold text-xs" onClick={() => copyToClipboard(getPaymentLinkUrl(link.id), link.id)}>
                        <Copy className="w-4 h-4 mr-2 text-slate-400" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-lg cursor-pointer font-bold text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => {
                        if (confirm('Delete this payment link?')) deleteMutation.mutate({ id: link.id })
                      }}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardContent className="p-8 flex-1 flex flex-col gap-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{link.title}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">${link.amount}</span>
                    <span className="text-xs font-black text-slate-400 uppercase">{link.currency}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-50">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Views</span>
                    </div>
                    <span className="text-base font-black text-slate-900">{link.viewCount}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sales</span>
                    </div>
                    <span className="text-base font-black text-slate-900">{link.paymentCount}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      className="data-[state=checked]:bg-primary"
                      checked={link.isActive}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: link.id, isActive: checked })
                      }
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Live
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 px-4"
                    onClick={() => copyToClipboard(getPaymentLinkUrl(link.id), link.id)}
                  >
                    {copiedId === link.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    Copy URL
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
