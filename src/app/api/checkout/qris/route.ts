export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

// QRIS baru dinonaktifkan. Data QrisPayment lama tetap dipertahankan untuk histori.
export async function POST() {
  return NextResponse.json(
    { error: 'Pembayaran QRIS sudah dinonaktifkan. Gunakan DOKU Checkout.' },
    { status: 410 }
  )
}
