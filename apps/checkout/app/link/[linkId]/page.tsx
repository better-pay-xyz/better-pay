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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <PaymentLinkCheckout link={link} />
    </div>
  )
}
