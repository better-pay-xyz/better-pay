import { ShieldCheck, Zap, Globe } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 text-center space-y-8 animate-fade-in max-w-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[2rem] bg-primary shadow-2xl shadow-primary/20 mb-4">
          <span className="text-white font-black text-3xl">B</span>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-tight">
            BetterPay <span className="text-primary">Checkout</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-md mx-auto">
            The next generation of decentralized payment processing. Fast, secure, and non-custodial.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-8">
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure</span>
          </div>
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instant</span>
          </div>
          <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-3">
            <div className="p-2 bg-sky-50 rounded-lg text-sky-600">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global</span>
          </div>
        </div>

        <div className="pt-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">
            Powered by Tempo Network
          </p>
        </div>
      </div>
    </div>
  )
}
