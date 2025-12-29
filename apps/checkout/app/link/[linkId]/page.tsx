import { notFound } from 'next/navigation'
import { db, paymentLinks } from '@better-pay/database'
import { eq, and } from 'drizzle-orm'
import { PaymentLinkCheckout } from './checkout'

interface Props {
  params: Promise<{ linkId: string }>
}

async function getPaymentLink(linkId: string) {
  const [link] = await db
    .select()
    .from(paymentLinks)
    .where(and(eq(paymentLinks.id, linkId), eq(paymentLinks.isActive, true)))
    .limit(1)

  return link || null
}

async function incrementViewCount(linkId: string) {
  await db
    .update(paymentLinks)
    .set({
      viewCount: (await db.select().from(paymentLinks).where(eq(paymentLinks.id, linkId)))[0]
        .viewCount + 1
    })
    .where(eq(paymentLinks.id, linkId))
}

export default async function PaymentLinkPage({ params }: Props) {
  const { linkId } = await params
  const link = await getPaymentLink(linkId)

  if (!link) {
    notFound()
  }

  // Increment view count
  await incrementViewCount(linkId)

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">BetterPay</span>
        </div>
        <PaymentLinkCheckout link={link} />
        
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Secure</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Encrypted</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Global</span>
          </div>
        </div>
      </div>
    </div>
  )
}
