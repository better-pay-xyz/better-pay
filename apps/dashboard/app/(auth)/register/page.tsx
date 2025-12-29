import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary shadow-xl shadow-primary/20 mb-4">
          <span className="text-white font-black text-2xl">B</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Create your account</h2>
        <p className="text-slate-500 font-medium">Start accepting crypto payments globally in minutes.</p>
      </div>

      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full -ml-16 -mb-16 blur-2xl" />
        <RegisterForm />
      </div>

      <p className="text-center text-sm font-bold text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:text-primary/80 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
