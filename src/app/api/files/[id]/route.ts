/**
 * GET /api/files/[id]
 * Serve file upload dari PostgreSQL (pengganti Cloudflare R2).
 *
 * File disimpan sebagai Bytes (bytea) di tabel FileUpload.
 * Response menggunakan Cache-Control panjang karena file tidak berubah setelah upload.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'File ID tidak valid.' }, { status: 400 })
  }

  let file: { data: Buffer; contentType: string; filename: string } | null = null

  try {
    file = await prisma.fileUpload.findUnique({
      where: { id },
      select: { data: true, contentType: true, filename: true },
    })
  } catch (err) {
    console.error('[files/serve] DB error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  if (!file) {
    return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 404 })
  }

  return new NextResponse(file.data, {
    status: 200,
    headers: {
      'Content-Type': file.contentType,
      'Content-Length': String(file.data.length),
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
