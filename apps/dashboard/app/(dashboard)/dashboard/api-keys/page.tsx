'use client'

import { useState } from 'react'
import { Plus, AlertTriangle, Copy, Check, Key, ShieldCheck, Loader2 } from 'lucide-react'
import { ApiKeyCard } from '@/components/api-key-card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc/client'
import { Card } from '@/components/ui/card'

export default function ApiKeysPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // tRPC queries and mutations
  const { data: apiKeys, isLoading, refetch } = trpc.apiKeys.list.useQuery()
  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setGeneratedKey(data.secretKey)
      refetch()
    }
  })
  const deleteMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: () => refetch()
  })

  function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      deleteMutation.mutate({ id })
    }
  }

  function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({
      name: newKeyName,
      environment: 'live'
    })
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
    setGeneratedKey(null)
    setCopied(false)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">API Keys</h1>
          <p className="text-slate-500 font-medium">
            Manage your API keys for custom payment integration.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
            {!generatedKey ? (
              <>
                <DialogHeader className="p-8 bg-slate-50/50 border-b border-slate-100 text-center">
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Create a secure key for your server-side integration.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateKey} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="keyName" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Key Name *</Label>
                    <Input
                      id="keyName"
                      required
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production Server Key"
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                      {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                      {createMutation.isPending ? 'Creating...' : 'Generate Secret Key'}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            ) : (
              <>
                <DialogHeader className="p-8 bg-emerald-50 border-b border-emerald-100 text-center">
                  <DialogTitle className="text-emerald-900">Key Generated!</DialogTitle>
                  <DialogDescription className="text-emerald-700">
                    This is the only time you can see this key.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-8 space-y-6">
                  <Alert variant="default" className="border-amber-100 bg-amber-50 rounded-2xl">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-900 font-bold text-xs uppercase tracking-widest">Security Warning</AlertTitle>
                    <AlertDescription className="text-amber-700 text-xs font-medium">
                      Store this key securely. We cannot recover it if lost.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Secret API Key</Label>
                    <div className="relative group">
                      <code className="block w-full px-4 py-4 bg-slate-900 text-emerald-400 rounded-2xl text-sm font-mono break-all font-bold shadow-inner">
                        {generatedKey}
                      </code>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button onClick={handleCopyAndClose} variant="premium" className="w-full">
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied to Clipboard
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy & Finish
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* API Keys List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 ml-1">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Your Integration Keys</h2>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-[2rem]" />
              ))}
            </div>
          ) : !apiKeys || apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white/50 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-slate-100">
              <div className="p-6 bg-white rounded-full w-fit mx-auto shadow-sm mb-4 text-slate-200">
                <Key className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">No API keys yet</h3>
              <p className="text-sm text-slate-500 font-medium mt-1 max-w-[250px]">
                Create an API key to start building your custom integration.
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="mt-6">
                Generate First Key
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {apiKeys.map((apiKey) => (
                <ApiKeyCard
                  key={apiKey.id}
                  apiKey={apiKey}
                  onDelete={handleDelete}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Security Banner */}
        <Card variant="premium" className="bg-slate-900 p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-primary/20" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="p-5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-1">
              <h3 className="text-xl font-black text-white">Security Best Practices</h3>
              <p className="text-slate-400 font-medium text-sm max-w-md leading-relaxed">
                Never share secret keys or commit them to version control. Use environment variables to keep your integration safe.
              </p>
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold h-12 px-8 rounded-xl">
              Security Guide
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
