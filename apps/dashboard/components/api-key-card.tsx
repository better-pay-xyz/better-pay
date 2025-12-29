'use client'

import { Trash2, Key, Calendar, Zap, Copy, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

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
  const [copied, setCopied] = useState(false)

  function formatDate(date: Date | null) {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.keyPrefix + '****************')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            {/* Header Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">{apiKey.name}</h3>
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-black uppercase tracking-widest h-5 mt-1">
                    Active
                  </Badge>
                </div>
              </div>
            </div>

            {/* Key Prefix Display */}
            <div className="relative group/key">
              <div 
                onClick={handleCopy}
                className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors group/btn"
              >
                <code className="text-sm font-mono text-slate-600 font-bold tracking-wider">
                  {apiKey.keyPrefix}<span className="opacity-20">••••••••••••••••</span>
                </code>
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-300 group-hover/btn:text-primary transition-colors" />
                )}
              </div>
            </div>

            {/* Footer Stats */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created {formatDate(apiKey.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                <Zap className="w-3.5 h-3.5" />
                <span>Last used {formatDate(apiKey.lastUsedAt)}</span>
              </div>
            </div>
          </div>

          {/* Action Column */}
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(apiKey.id)}
              disabled={isDeleting}
              className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all h-10 w-10"
              title="Delete key"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
