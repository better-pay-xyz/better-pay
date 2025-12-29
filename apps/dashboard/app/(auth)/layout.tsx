export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-4">
        {children}
      </div>
      
      {/* Footer info */}
      <div className="absolute bottom-8 left-0 w-full text-center">
        <div className="flex items-center justify-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <span>Enterprise Grade</span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <span>Non-Custodial</span>
          <div className="w-1 h-1 rounded-full bg-slate-200" />
          <span>Global Reach</span>
        </div>
      </div>
    </div>
  )
}
