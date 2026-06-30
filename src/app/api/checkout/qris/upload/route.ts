export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { sendQrisAdminNotif } from '@/lib/whatsapp'

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

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

    const formData = await req.formData()
    const file = formData.get('proof') as File | null
    const qrisPaymentId = formData.get('qrisPaymentId') as string | null

    if (!file || !qrisPaymentId) {
      return NextResponse.json({ error: 'File dan ID transaksi wajib diisi' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran file maksimal 2MB' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file harus JPG, PNG, atau WebP' },
        { status: 400 }
      )
    }

    // Pastikan transaksi milik keluarga ini dan masih PENDING
    const payment = await prisma.qrisPayment.findFirst({
      where: { id: qrisPaymentId, familySpaceId, status: 'PENDING' },
    })
    if (!payment) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan atau sudah diproses' },
        { status: 404 }
      )
    }

    // Simpan file secara streaming ke disk (hemat RAM — tidak buffer di memory lama)
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'proofs')
    await mkdir(uploadsDir, { recursive: true })

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${qrisPaymentId}-${Date.now()}.${ext}`
    const filepath = join(uploadsDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    // Update record dengan path bukti
    await prisma.qrisPayment.update({
      where: { id: qrisPaymentId },
      data: { proofImagePath: `/uploads/proofs/${filename}` },
    })

    // Kirim notifikasi WhatsApp ke admin — fire-and-forget, tidak blokir response
    const appUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? 'http://localhost:3000'
    const family = await prisma.familySpace.findUnique({
      where: { id: familySpaceId },
      select: { name: true },
    })
    sendQrisAdminNotif({
      familyName: family?.name ?? 'Tidak diketahui',
      planType: payment.planType,
      billingCycle: payment.billingCycle,
      totalAmount: payment.totalAmount,
      uniqueCode: payment.uniqueCode,
      qrisPaymentId: payment.id,
      adminUrl: `${appUrl}/superadmin/qris-payments`,
    }).catch((e) => console.error('[QRIS Notif] fire-and-forget error:', e))

    return NextResponse.json({ success: true, proofImagePath: `/uploads/proofs/${filename}` })
  } catch (err) {
    console.error('[api/checkout/qris/upload]', err)
    return NextResponse.json({ error: 'Gagal menyimpan bukti transfer' }, { status: 500 })
  }
}
