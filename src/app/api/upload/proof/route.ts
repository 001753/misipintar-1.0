import { auth } from '@/lib/auth/config'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'CHILD') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const childId = session.user.childId!
  const familySpaceId = session.user.familySpaceId!

  // [7] Rate limit: max 10 upload per 1 jam per anak
  const rl = await rateLimit({
    key: `upload:${childId}`,
    max: 10,
    windowSeconds: 60 * 60,
  })
  if (!rl.success) {
    return NextResponse.json(
      { error: `Terlalu banyak upload. Coba lagi dalam ${Math.ceil((rl.retryAfterSeconds ?? 3600) / 60)} menit.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds ?? 3600) } }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ukuran file maksimal 5MB.' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Format file harus JPG, PNG, atau WebP.' }, { status: 400 })
  }

  // ── Coba upload ke Cloudflare R2 jika dikonfigurasi ──────────────────────
  const r2AccountId = process.env.R2_ACCOUNT_ID
  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const r2BucketName = process.env.R2_BUCKET_NAME
  const r2PublicUrl = process.env.R2_PUBLIC_URL

  if (r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2BucketName) {
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
      const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey },
      })

      const timestamp = Date.now()
      const id = nanoid(10)
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const key = `proofs/${familySpaceId}/${childId}/${timestamp}-${id}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())

      await s3.send(new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }))

      const url = r2PublicUrl
        ? `${r2PublicUrl}/${key}`
        : `https://${r2BucketName}.r2.cloudflarestorage.com/${key}`
      return NextResponse.json({ url })
    } catch (err) {
      console.error('[upload/proof] R2 upload error — falling back to DB storage:', err)
      // fall through ke DB storage
    }
  }

  // ── Simpan ke PostgreSQL (fallback utama untuk cPanel tanpa R2) ───────────
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const filename = `proof-${Date.now()}-${nanoid(8)}.${ext}`

    const saved = await prisma.fileUpload.create({
      data: {
        filename,
        contentType: file.type,
        size: file.size,
        data: buffer,
        childId,
        familySpaceId,
      },
      select: { id: true },
    })

    const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? ''
    const url = `${appUrl}/api/files/${saved.id}`
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[upload/proof] DB storage error:', err)
    return NextResponse.json({ error: 'Upload gagal. Coba lagi.' }, { status: 500 })
  }
}
