/**
 * WhatsApp OTP Service via Fonnte API
 * Docs: https://fonnte.com/api
 *
 * Env vars required:
 *   FONNTE_TOKEN  — token dari dashboard fonnte.com
 *
 * Jika FONNTE_TOKEN tidak di-set (development), OTP dicetak ke console.
 */

const FONNTE_URL = 'https://api.fonnte.com/send'

export function normalizePhone(raw: string): string {
  let p = raw.replace(/\s+/g, '').replace(/-/g, '')
  if (p.startsWith('+')) p = p.slice(1)
  if (p.startsWith('0')) p = '62' + p.slice(1)
  if (!p.startsWith('62')) p = '62' + p
  return p
}

export function validatePhone(raw: string): boolean {
  const p = normalizePhone(raw)
  return /^62\d{8,13}$/.test(p)
}

/**
 * Kirim notifikasi WhatsApp ke admin saat bukti QRIS baru masuk.
 * Fire-and-forget — error tidak memblokir response ke user.
 */
export async function sendQrisAdminNotif(params: {
  familyName: string
  planType: string
  billingCycle: string
  totalAmount: number
  uniqueCode: number
  qrisPaymentId: string
  adminUrl: string
}): Promise<void> {
  const token = process.env.FONNTE_TOKEN
  const adminWa = process.env.QRIS_ADMIN_WA

  const { familyName, planType, billingCycle, totalAmount, uniqueCode, adminUrl } = params

  const cycleLabel = billingCycle === 'YEARLY' ? 'Tahunan' : 'Bulanan'
  const planLabel = planType === 'EDUCATOR' ? 'Educator' : planType === 'PRO' ? 'Pro' : planType
  const nominalFmt = `Rp ${totalAmount.toLocaleString('id-ID')}`

  const message =
    `🧾 *Bukti Transfer QRIS Masuk!*\n\n` +
    `👨‍👩‍👧 Keluarga: *${familyName}*\n` +
    `📦 Paket: *${planLabel} ${cycleLabel}*\n` +
    `💰 Nominal: *${nominalFmt}*\n` +
    `🔢 Kode Unik: *${uniqueCode}*\n\n` +
    `Klik link berikut untuk review & approve:\n` +
    `${adminUrl}\n\n` +
    `_Misi Pintar Admin System_`

  if (!token || !adminWa) {
    console.warn(
      '[QRIS Notif] FONNTE_TOKEN atau QRIS_ADMIN_WA tidak di-set — notif WA dilewati'
    )
    console.warn(`  ➜ Pesan yang akan dikirim:\n${message}`)
    return
  }

  const normalized = normalizePhone(adminWa)

  try {
    const res = await fetch(FONNTE_URL, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: normalized,
        message,
        countryCode: '62',
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[QRIS Notif] Fonnte error ${res.status}: ${body}`)
      return
    }

    const data = await res.json().catch(() => ({}))
    if (data?.status === false) {
      console.error(`[QRIS Notif] Fonnte gagal: ${data?.reason ?? 'unknown'}`)
    }
  } catch (err) {
    // Fire-and-forget — jangan sampai error notif menggagalkan upload
    console.error('[QRIS Notif] Gagal kirim WA:', err)
  }
}

export async function sendWhatsAppOtp(phone: string, otp: string): Promise<void> {
  const token = process.env.FONNTE_TOKEN
  const normalized = normalizePhone(phone)

  const message =
    `🔐 *Kode OTP Misi Pintar*\n\n` +
    `Kode verifikasi Anda: *${otp}*\n\n` +
    `Kode berlaku selama *10 menit*.\n` +
    `Jangan bagikan kode ini kepada siapapun.\n\n` +
    `_Jika Anda tidak meminta kode ini, abaikan pesan ini._`

  if (!token) {
    console.warn('[WhatsApp OTP] FONNTE_TOKEN not set — dev mode, printing OTP:')
    console.warn(`  ➜ Phone: ${normalized}  |  OTP: ${otp}`)
    return
  }

  const res = await fetch(FONNTE_URL, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: normalized,
      message,
      countryCode: '62',
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Fonnte API error ${res.status}: ${body}`)
  }

  const data = await res.json().catch(() => ({}))
  if (data?.status === false) {
    throw new Error(`Fonnte gagal: ${data?.reason ?? 'unknown'}`)
  }
}
