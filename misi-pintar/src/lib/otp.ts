import { prisma } from '@/lib/prisma'
import { normalizePhone } from '@/lib/whatsapp'
import type { OtpPurpose } from '@prisma/client'
import crypto from 'crypto'

const OTP_EXPIRY_MINUTES = 10
const MAX_OTP_ATTEMPTS = 5
const OTP_COOLDOWN_SECONDS = 60

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Buat OTP baru untuk nomor WA dan tujuan tertentu.
 * Rate limit: 1 OTP per COOLDOWN_SECONDS per nomor.
 */
export async function createOtp(
  rawPhone: string,
  purpose: OtpPurpose
): Promise<{ code: string; alreadySentRecently: boolean }> {
  const phone = normalizePhone(rawPhone)

  // Cek apakah ada OTP yang baru saja dikirim (cooldown)
  const cooldownCutoff = new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000)
  const recent = await prisma.otpCode.findFirst({
    where: {
      phone,
      purpose,
      createdAt: { gte: cooldownCutoff },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (recent) {
    const waitSec = Math.ceil(
      OTP_COOLDOWN_SECONDS - (Date.now() - recent.createdAt.getTime()) / 1000
    )
    throw new Error(`COOLDOWN:${waitSec}`)
  }

  // Batalkan OTP lama yang belum dipakai
  await prisma.otpCode.updateMany({
    where: {
      phone,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { expiresAt: new Date() }, // expire segera
  })

  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.otpCode.create({
    data: { phone, code, purpose, expiresAt },
  })

  return { code, alreadySentRecently: false }
}

/**
 * Verifikasi OTP.
 * Return: { valid: true } atau throw dengan pesan error.
 */
export async function verifyOtp(
  rawPhone: string,
  code: string,
  purpose: OtpPurpose
): Promise<{ otpId: string }> {
  const phone = normalizePhone(rawPhone)

  const otp = await prisma.otpCode.findFirst({
    where: {
      phone,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) throw new Error('OTP tidak ditemukan atau sudah kedaluwarsa.')

  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    throw new Error('Terlalu banyak percobaan. Minta OTP baru.')
  }

  if (otp.code !== code) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    })
    const remaining = MAX_OTP_ATTEMPTS - otp.attempts - 1
    throw new Error(`Kode OTP salah. Sisa ${remaining} percobaan.`)
  }

  return { otpId: otp.id }
}

/**
 * Setelah OTP valid untuk reset password, generate reset token.
 */
export async function markOtpUsedAndCreateResetToken(otpId: string): Promise<string> {
  const resetToken = generateResetToken()
  await prisma.otpCode.update({
    where: { id: otpId },
    data: {
      usedAt: new Date(),
      resetToken,
    },
  })
  return resetToken
}

/**
 * Validasi reset token dan return phone number.
 * Token valid 30 menit setelah OTP verified.
 */
export async function validateResetToken(token: string): Promise<string> {
  const otp = await prisma.otpCode.findUnique({
    where: { resetToken: token },
  })

  if (!otp || !otp.usedAt) throw new Error('Token reset tidak valid.')

  const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000
  if (Date.now() - otp.usedAt.getTime() > RESET_TOKEN_EXPIRY_MS) {
    throw new Error('Token reset sudah kedaluwarsa. Ulangi proses lupa password.')
  }

  return otp.phone
}
