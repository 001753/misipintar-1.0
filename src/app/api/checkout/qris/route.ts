export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

const ALLOWED_PLANS = ['PRO', 'EDUCATOR'] as const
const ALLOWED_CYCLES = ['MONTHLY', 'YEARLY'] as const

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const familySpaceId = session.user.familySpaceId
    if (!familySpaceId) {
      return NextResponse.json({ error: 'Tidak ada FamilySpace' }, { status: 400 })
    }

    const body = await req.json()
    const { planType, billingCycle } = body

    if (!ALLOWED_PLANS.includes(planType)) {
      return NextResponse.json({ error: 'Plan tidak valid' }, { status: 400 })
    }
    if (!ALLOWED_CYCLES.includes(billingCycle)) {
      return NextResponse.json({ error: 'Siklus billing tidak valid' }, { status: 400 })
    }

    // Ambil harga plan dari DB agar konsisten dengan admin
    const plan = await prisma.plan.findUnique({ where: { type: planType } })
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plan tidak tersedia' }, { status: 404 })
    }

    const baseAmount = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.price
    if (baseAmount <= 0) {
      return NextResponse.json({ error: 'Harga plan tidak valid' }, { status: 400 })
    }

    // Generate kode unik 3 digit (100-999) — cek tidak bentrok dengan PENDING lain
    let uniqueCode = 100
    let attempts = 0
    while (attempts < 20) {
      uniqueCode = Math.floor(Math.random() * 900) + 100
      const bentrok = await prisma.qrisPayment.findFirst({
        where: {
          status: 'PENDING',
          uniqueCode,
          totalAmount: baseAmount + uniqueCode,
        },
      })
      if (!bentrok) break
      attempts++
    }

    const totalAmount = baseAmount + uniqueCode

    // Batalkan transaksi PENDING lama dari keluarga ini (bersihkan)
    await prisma.qrisPayment.updateMany({
      where: { familySpaceId, status: 'PENDING' },
      data: { status: 'REJECTED', adminNote: 'Digantikan oleh transaksi baru' },
    })

    const qrisPayment = await prisma.qrisPayment.create({
      data: {
        familySpaceId,
        planType,
        billingCycle,
        baseAmount,
        uniqueCode,
        totalAmount,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      id: qrisPayment.id,
      planType,
      planName: plan.name,
      billingCycle,
      baseAmount,
      uniqueCode,
      totalAmount,
    })
  } catch (err) {
    console.error('[api/checkout/qris]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
