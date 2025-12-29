'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldCheck, Mail, Lock, User, Loader2 } from 'lucide-react'

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEmailRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Registration failed')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleRegister() {
    window.location.href = '/api/auth/signin/google'
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-800 rounded-2xl">
          <AlertDescription className="font-bold">{error}</AlertDescription>
        </Alert>
      )}

      {/* Email/Password Form */}
      <form onSubmit={handleEmailRegister} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              className="h-12 pl-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@company.com"
              required
              className="h-12 pl-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              className="h-12 pl-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <ShieldCheck className="w-5 h-5 mr-2" />
          )}
          {loading ? 'Creating Account...' : 'Get Started Now'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-100" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]">
          <span className="px-4 bg-white text-slate-400">or join with</span>
        </div>
      </div>

      {/* Google OAuth */}
      <Button
        onClick={handleGoogleRegister}
        type="button"
        variant="outline"
        className="w-full h-12 rounded-xl border-slate-100 font-bold text-slate-600 hover:bg-slate-50 gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      {/* Dev Mode */}
      {process.env.NODE_ENV === 'development' && (
        <Button
          onClick={() => router.push('/api/auth/dev-bypass')}
          type="button"
          variant="ghost"
          className="w-full h-12 border-2 border-dashed border-amber-100 rounded-xl bg-amber-50/50 text-amber-700 font-bold hover:bg-amber-100 hover:border-amber-200"
        >
          🔓 Developer Bypass
        </Button>
      )}
    </div>
  )
}
