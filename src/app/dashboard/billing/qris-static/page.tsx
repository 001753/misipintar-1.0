export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CheckoutClient from './checkout-client'

export default async function QrisStaticPage({
  searchParams,
}: {
  searchParams: Promise<{ planType?: string; cycle?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const familySpaceId = session.user.familySpaceId
  if (!familySpaceId) redirect('/login')

  const { planType, cycle } = await searchParams

  // Ambil plan berbayar yang aktif
  const plans = await prisma.plan.findMany({
    where: { isActive: true, type: { in: ['PRO', 'EDUCATOR'] } },
    orderBy: { price: 'asc' },
  })

  // Cek pembayaran PENDING yang mungkin belum selesai
  const pendingPayment = await prisma.qrisPayment.findFirst({
    where: { familySpaceId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  })

  const nmid = process.env.NEXT_PUBLIC_NMID ?? ''
  const merchantName = process.env.NEXT_PUBLIC_MERCHANT_NAME ?? 'Misi Pintar'

  return (
    <CheckoutClient
      plans={plans.map((p) => ({
        id: p.id,
        type: p.type as string,
        name: p.name,
        price: p.price,
        yearlyPrice: p.yearlyPrice,
      }))}
      defaultPlanType={planType ?? null}
      defaultCycle={(cycle as 'MONTHLY' | 'YEARLY' | null) ?? null}
      pendingPayment={
        pendingPayment
          ? {
              id: pendingPayment.id,
              planType: pendingPayment.planType as string,
              billingCycle: pendingPayment.billingCycle,
              totalAmount: pendingPayment.totalAmount,
              uniqueCode: pendingPayment.uniqueCode,
              proofImagePath: pendingPayment.proofImagePath,
            }
          : null
      }
      nmid={nmid}
      merchantName={merchantName}
    />
  )
}
