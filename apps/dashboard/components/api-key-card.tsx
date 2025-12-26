'use client'

import { Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  createdAt: Date
  lastUsedAt: Date | null
}

interface ApiKeyCardProps {
  apiKey: ApiKey
  onDelete: (id: string) => void
  isDeleting?: boolean
}

export function ApiKeyCard({ apiKey, onDelete, isDeleting }: ApiKeyCardProps) {
  function formatDate(date: Date | null) {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Name */}
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">{apiKey.name}</h3>
              <Badge variant="secondary">Live</Badge>
            </div>

            {/* Key display (only prefix since actual key is hashed) */}
            <div className="mt-4 flex items-center gap-2">
              <code className="px-3 py-2 bg-muted rounded-md text-sm font-mono flex-1">
                {apiKey.keyPrefix}
              </code>
            </div>

            {/* Dates */}
            <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
              <span>Created: {formatDate(apiKey.createdAt)}</span>
              <span>Last used: {formatDate(apiKey.lastUsedAt)}</span>
            </div>
          </div>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(apiKey.id)}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Delete key"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
