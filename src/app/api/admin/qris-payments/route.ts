export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { addMonths, addYears } from 'date-fns'
import { sendQrisUserNotif } from '@/lib/whatsapp'

// ─── GET: Daftar semua QRIS payment (admin only) ──────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'PENDING'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const PAGE_SIZE = 30

    const where =
      status === 'ALL'
        ? {}
        : { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' }

    const [payments, total] = await Promise.all([
      prisma.qrisPayment.findMany({
        where,
        include: {
          familySpace: {
            select: { name: true, spaceCode: true },
          },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.qrisPayment.count({ where }),
    ])

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        familySpaceId: p.familySpaceId,
        familyName: p.familySpace.name,
        spaceCode: p.familySpace.spaceCode,
        planType: p.planType,
        billingCycle: p.billingCycle,
        baseAmount: p.baseAmount,
        uniqueCode: p.uniqueCode,
        totalAmount: p.totalAmount,
        proofImagePath: p.proofImagePath,
        status: p.status,
        adminNote: p.adminNote,
        reviewedBy: p.reviewedBy,
        reviewedAt: p.reviewedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        hasProof: !!p.proofImagePath,
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
    })
  } catch (err) {
    console.error('[api/admin/qris-payments GET]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

// ─── PATCH: Approve atau Reject pembayaran ────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, action, adminNote } = body

    if (!id || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Parameter tidak valid' }, { status: 400 })
    }

    const payment = await prisma.qrisPayment.findUnique({
      where: { id },
      include: {
        familySpace: {
          include: {
            subscription: { include: { plan: true } },
            owner: { select: { phone: true } },   // untuk notifikasi WA ke user
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Pembayaran tidak ditemukan' }, { status: 404 })
    }
    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Pembayaran sudah diproses sebelumnya' },
        { status: 409 }
      )
    }

    if (action === 'REJECT') {
      const note = adminNote ?? 'Ditolak oleh admin'

      await prisma.qrisPayment.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminNote: note,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      })

      // Catat audit log
      await prisma.adminAuditLog.create({
        data: {
          adminId: session.user.id,
          action: 'QRIS_PAYMENT_REJECTED',
          targetType: 'QrisPayment',
          targetId: id,
          after: { adminNote: note },
        },
      })

      // Notifikasi WA ke user — fire-and-forget
      const ownerPhone = payment.familySpace.owner.phone
      if (ownerPhone) {
        const appUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? ''
        sendQrisUserNotif({
          userPhone: ownerPhone,
          familyName: payment.familySpace.name,
          action: 'REJECTED',
          planType: payment.planType,
          billingCycle: payment.billingCycle,
          totalAmount: payment.totalAmount,
          adminNote: note,
          dashboardUrl: `${appUrl}/dashboard/billing`,
        }).catch((e) => console.error('[QRIS User Notif REJECT] fire-and-forget error:', e))
      }

      return NextResponse.json({ success: true, status: 'REJECTED' })
    }

    // ── APPROVE: aktivasi langganan ──────────────────────────────────────────
    const plan = await prisma.plan.findUnique({ where: { type: payment.planType } })
    if (!plan) {
      return NextResponse.json({ error: 'Plan tidak ditemukan di database' }, { status: 500 })
    }

    const now = new Date()
    const periodEnd =
      payment.billingCycle === 'YEARLY' ? addYears(now, 1) : addMonths(now, 1)

    // Mapping PlanType → SubStatus
    const statusMap: Record<string, 'PRO' | 'EDUCATOR' | 'SCHOOL'> = {
      PRO: 'PRO',
      EDUCATOR: 'EDUCATOR',
      SCHOOL: 'SCHOOL',
    }
    const newSubStatus = statusMap[payment.planType] ?? 'PRO'

    const familySpaceId = payment.familySpaceId

    // Upsert subscription (buat atau update)
    await prisma.subscription.upsert({
      where: { familySpaceId },
      create: {
        familySpaceId,
        planId: plan.id,
        status: newSubStatus,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        cancelReason: null,
      },
      update: {
        planId: plan.id,
        status: newSubStatus,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        cancelReason: null,
      },
    })

    // Update status QrisPayment
    await prisma.qrisPayment.update({
      where: { id },
      data: {
        status: 'APPROVED',
        adminNote: adminNote ?? null,
        reviewedBy: session.user.id,
        reviewedAt: now,
      },
    })

    // Catat audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: 'QRIS_PAYMENT_APPROVED',
        targetType: 'QrisPayment',
        targetId: id,
        after: {
          planType: payment.planType,
          billingCycle: payment.billingCycle,
          totalAmount: payment.totalAmount,
          periodEnd: periodEnd.toISOString(),
        },
      },
    })

    // Notifikasi WA ke user — fire-and-forget
    const ownerPhone = payment.familySpace.owner.phone
    if (ownerPhone) {
      const appUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? ''
      sendQrisUserNotif({
        userPhone: ownerPhone,
        familyName: payment.familySpace.name,
        action: 'APPROVED',
        planType: payment.planType,
        billingCycle: payment.billingCycle,
        totalAmount: payment.totalAmount,
        periodEnd,
        adminNote: adminNote ?? undefined,
        dashboardUrl: `${appUrl}/dashboard/billing`,
      }).catch((e) => console.error('[QRIS User Notif APPROVE] fire-and-forget error:', e))
    }

    return NextResponse.json({ success: true, status: 'APPROVED', periodEnd: periodEnd.toISOString() })
  } catch (err) {
    console.error('[api/admin/qris-payments PATCH]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
