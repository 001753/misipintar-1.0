export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import QrisPaymentsClient from './qris-client'

export default async function QrisPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') redirect('/login')

  const { status, page } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? '1', 10))
  const PAGE_SIZE = 30
  const filterStatus = status ?? 'PENDING'

  const where =
    filterStatus === 'ALL'
      ? {}
      : { status: filterStatus as 'PENDING' | 'APPROVED' | 'REJECTED' }

  const [payments, total] = await Promise.all([
    prisma.qrisPayment.findMany({
      where,
      include: {
        familySpace: { select: { name: true, spaceCode: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.qrisPayment.count({ where }),
  ])

  // Hitung badge pending untuk header
  const pendingCount = await prisma.qrisPayment.count({ where: { status: 'PENDING' } })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">QRIS Manual</h1>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {pendingCount} menunggu
              </span>
            )}
          </div>
          <p className="text-gray-400 mt-1">
            Verifikasi pembayaran QRIS statis — approve atau reject bukti transfer masuk
          </p>
        </div>
      </div>

      <QrisPaymentsClient
        payments={payments.map((p) => ({
          id: p.id,
          familyName: p.familySpace.name,
          spaceCode: p.familySpace.spaceCode,
          planType: p.planType as string,
          billingCycle: p.billingCycle,
          baseAmount: p.baseAmount,
          uniqueCode: p.uniqueCode,
          totalAmount: p.totalAmount,
          proofImagePath: p.proofImagePath,
          status: p.status as string,
          adminNote: p.adminNote,
          reviewedAt: p.reviewedAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
        }))}
        total={total}
        page={pageNum}
        pageSize={PAGE_SIZE}
        currentStatus={filterStatus}
      />
    </div>
  )
}
