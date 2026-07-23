export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

// Bukti transfer QRIS baru tidak lagi diterima. Histori lama tetap dapat dilihat admin.
export async function POST() {
  return NextResponse.json(
    { error: 'Pembayaran QRIS sudah dinonaktifkan. Gunakan DOKU Checkout.' },
    { status: 410 }
  )
}
