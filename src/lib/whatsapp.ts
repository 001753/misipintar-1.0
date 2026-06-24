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
