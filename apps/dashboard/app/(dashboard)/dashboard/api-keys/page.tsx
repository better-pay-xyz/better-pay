'use client'

import { useState } from 'react'
import { Plus, AlertTriangle, Copy, Check, Key } from 'lucide-react'
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage your API keys for payment integration
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {!generatedKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for your integration.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      required
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API Key"
                    />
                  </div>

                  <DialogFooter>
                    <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Creating...' : 'Create API Key'}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Save this key securely. You won't be able to see it again.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert variant="default" className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Save this key now</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      This is the only time you will be able to see this key. Copy it and store
                      it securely.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Your new API key</Label>
                    <code className="block px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                      {generatedKey}
                    </code>
                  </div>

                  <DialogFooter>
                    <Button onClick={handleCopyAndClose} className="w-full">
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy & Close
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

      {/* Security Warning Banner */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Keep your API keys secure</AlertTitle>
        <AlertDescription>
          Never share your API keys publicly or commit them to version control. Use environment
          variables to store them securely.
        </AlertDescription>
      </Alert>

      {/* API Keys List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading API keys...</p>
        </div>
      ) : !apiKeys || apiKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Key className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No API keys yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create an API key to start integrating with BetterPay
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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
  )
}
