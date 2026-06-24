'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { signIn, signOut } from '@/lib/auth/config'
import { validateParentPassword } from '@/lib/auth/passwordPolicy'
import { normalizePhone, validatePhone, sendWhatsAppOtp } from '@/lib/whatsapp'
import { createOtp, verifyOtp, markOtpUsedAndCreateResetToken, validateResetToken } from '@/lib/otp'
import type { ActionResult } from '@/types'

// ─── Helpers ─────────────────────────────────────────────

async function generateUniqueSpaceCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const existing = await prisma.familySpace.findUnique({
      where: { spaceCode: code },
    })
    if (!existing) return code
  }
  throw new Error('Gagal generate kode unik. Coba lagi.')
}

// ─── [1.5] Register FamilySpace ───────────────────────────

const registerSchema = z.object({
  ownerName: z.string().min(2, 'Nama minimal 2 karakter'),
  phone: z.string().min(8, 'Nomor WhatsApp tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  familyName: z.string().min(2, 'Nama keluarga minimal 2 karakter'),
})

export async function registerFamilySpace(
  formData: FormData
): Promise<ActionResult<{ spaceCode: string }>> {
  const parsed = registerSchema.safeParse({
    ownerName: formData.get('ownerName'),
    phone: formData.get('phone'),
    password: formData.get('password'),
    familyName: formData.get('familyName'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }
  }

  const { ownerName, phone, password, familyName } = parsed.data

  if (!validatePhone(phone)) {
    return { success: false, error: 'Format nomor WhatsApp tidak valid.' }
  }

  const normalizedPhone = normalizePhone(phone)

  try {
    validateParentPassword(password)
  } catch (err: any) {
    return { success: false, error: err?.errors?.[0]?.message ?? err?.message ?? 'Password tidak memenuhi syarat.' }
  }

  const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
  if (existing) {
    return { success: false, error: 'Nomor WhatsApp sudah terdaftar.' }
  }

  const [passwordHash, spaceCode, starterPlan] = await Promise.all([
    bcrypt.hash(password, 12),
    generateUniqueSpaceCode(),
    prisma.plan.findFirst({ where: { type: 'STARTER' } }),
  ])

  if (!starterPlan) {
    return { success: false, error: 'Konfigurasi plan belum siap. Hubungi admin.' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          name: ownerName,
          phone: normalizedPhone,
          passwordHash,
          role: 'PARENT',
        },
      })

      const familySpace = await tx.familySpace.create({
        data: {
          name: familyName,
          spaceCode,
          ownerId: owner.id,
          users: { connect: { id: owner.id } },
        },
      })

      await tx.user.update({
        where: { id: owner.id },
        data: { familySpaceId: familySpace.id },
      })

      const hundredYearsLater = new Date()
      hundredYearsLater.setFullYear(hundredYearsLater.getFullYear() + 100)

      await tx.subscription.create({
        data: {
          familySpaceId: familySpace.id,
          planId: starterPlan.id,
          status: 'FREE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: hundredYearsLater,
        },
      })
    })

    return { success: true, data: { spaceCode } }
  } catch (err) {
    console.error('[registerFamilySpace]', err)
    return { success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' }
  }
}

// ─── Login Parent ─────────────────────────────────────────

export async function loginParent(
  formData: FormData
): Promise<ActionResult<null>> {
  try {
    await signIn('parent-credentials', {
      phone: formData.get('phone'),
      password: formData.get('password'),
      redirect: false,
    })
    return { success: true, data: null }
  } catch (err: any) {
    const msg = err?.message ?? ''
    if (msg.includes('TOO_MANY_ATTEMPTS') || msg.includes('RATE_LIMITED')) {
      return { success: false, error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' }
    }
    return { success: false, error: 'Nomor WhatsApp atau password salah.' }
  }
}

// ─── Login Child ──────────────────────────────────────────

export async function loginChild(
  formData: FormData
): Promise<ActionResult<null>> {
  try {
    await signIn('child-credentials', {
      spaceCode: formData.get('spaceCode'),
      username: formData.get('username'),
      password: formData.get('password'),
      redirect: false,
    })
    return { success: true, data: null }
  } catch (err: any) {
    const msg = err?.message ?? ''
    if (msg.includes('TOO_MANY_ATTEMPTS') || msg.includes('RATE_LIMITED')) {
      return { success: false, error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' }
    }
    return { success: false, error: 'Kode keluarga, username, atau password salah.' }
  }
}

// ─── Login SuperAdmin (dedicated — untuk /adm-panel) ─────

export async function loginSuperAdmin(
  formData: FormData
): Promise<ActionResult<null>> {
  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi.' }
  }

  const user = await prisma.user.findUnique({ where: { email } }).catch(() => null)
  if (!user || user.role !== 'SUPER_ADMIN') {
    const ip = '0.0.0.0'
    await import('@/lib/auth/loginGuard').then((m) =>
      m.recordLoginAttempt(email || 'unknown', ip, false).catch(() => {})
    )
    return { success: false, error: 'Email atau password salah.' }
  }

  // SuperAdmin login: masukkan email sebagai "phone" field di credentials
  // (auth config handles email fallback via OR query)
  try {
    await signIn('parent-credentials', {
      phone: email,
      password,
      redirect: false,
    })
    return { success: true, data: null }
  } catch (err: any) {
    const msg = err?.message ?? ''
    if (msg.includes('TOO_MANY_ATTEMPTS') || msg.includes('RATE_LIMITED')) {
      return { success: false, error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' }
    }
    return { success: false, error: 'Email atau password salah.' }
  }
}

// ─── OTP: Kirim OTP lupa password via WhatsApp ───────────

export async function sendForgotPasswordOtp(
  formData: FormData
): Promise<ActionResult<{ phone: string }>> {
  const rawPhone = formData.get('phone')?.toString().trim() ?? ''

  if (!validatePhone(rawPhone)) {
    return { success: false, error: 'Format nomor WhatsApp tidak valid.' }
  }

  const phone = normalizePhone(rawPhone)

  // Pastikan nomor terdaftar
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    // Kembalikan pesan generik — jangan bocorkan apakah nomor ada atau tidak
    return {
      success: true,
      data: { phone },
    }
  }

  try {
    const { code } = await createOtp(phone, 'RESET_PASSWORD')
    await sendWhatsAppOtp(phone, code)
    return { success: true, data: { phone } }
  } catch (err: any) {
    const msg = err?.message ?? ''
    if (msg.startsWith('COOLDOWN:')) {
      const secs = msg.split(':')[1]
      return { success: false, error: `Tunggu ${secs} detik sebelum minta OTP baru.` }
    }
    console.error('[sendForgotPasswordOtp]', err)
    return { success: false, error: 'Gagal mengirim OTP. Coba beberapa saat lagi.' }
  }
}

// ─── OTP: Verifikasi OTP lupa password ───────────────────

export async function verifyForgotPasswordOtp(
  formData: FormData
): Promise<ActionResult<{ resetToken: string }>> {
  const phone = formData.get('phone')?.toString().trim() ?? ''
  const code = formData.get('code')?.toString().trim() ?? ''

  if (!phone || code.length !== 6) {
    return { success: false, error: 'Data tidak lengkap.' }
  }

  try {
    const { otpId } = await verifyOtp(phone, code, 'RESET_PASSWORD')
    const resetToken = await markOtpUsedAndCreateResetToken(otpId)
    return { success: true, data: { resetToken } }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Verifikasi gagal.' }
  }
}

// ─── Reset Password dengan token ─────────────────────────

const resetPasswordSchema = z.object({
  resetToken: z.string().min(10),
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

export async function resetPasswordWithToken(
  formData: FormData
): Promise<ActionResult<null>> {
  const parsed = resetPasswordSchema.safeParse({
    resetToken: formData.get('resetToken'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' }
  }

  const { resetToken, password } = parsed.data

  try {
    validateParentPassword(password)
  } catch (err: any) {
    return { success: false, error: err?.errors?.[0]?.message ?? err?.message ?? 'Password tidak memenuhi syarat.' }
  }

  try {
    const phone = await validateResetToken(resetToken)

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) return { success: false, error: 'Akun tidak ditemukan.' }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    return { success: true, data: null }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Reset password gagal.' }
  }
}

// ─── Ganti No. WA: Kirim OTP ke nomor baru ───────────────

export async function sendChangePhoneOtp(
  userId: string,
  rawPhone: string
): Promise<ActionResult<{ phone: string }>> {
  if (!validatePhone(rawPhone)) {
    return { success: false, error: 'Format nomor WhatsApp tidak valid.' }
  }

  const newPhone = normalizePhone(rawPhone)

  // Pastikan nomor belum dipakai akun lain
  const conflict = await prisma.user.findUnique({ where: { phone: newPhone } })
  if (conflict && conflict.id !== userId) {
    return { success: false, error: 'Nomor WhatsApp ini sudah digunakan akun lain.' }
  }

  // Pastikan bukan nomor yang sama
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } })
  if (me?.phone === newPhone) {
    return { success: false, error: 'Nomor baru sama dengan nomor saat ini.' }
  }

  try {
    const { code } = await createOtp(newPhone, 'VERIFY_PHONE')
    await sendWhatsAppOtp(newPhone, code)
    return { success: true, data: { phone: newPhone } }
  } catch (err: any) {
    const msg = err?.message ?? ''
    if (msg.startsWith('COOLDOWN:')) {
      const secs = msg.split(':')[1]
      return { success: false, error: `Tunggu ${secs} detik sebelum minta OTP baru.` }
    }
    console.error('[sendChangePhoneOtp]', err)
    return { success: false, error: 'Gagal mengirim OTP. Coba beberapa saat lagi.' }
  }
}

// ─── Ganti No. WA: Verifikasi OTP & simpan nomor baru ────

export async function verifyAndChangePhone(
  userId: string,
  newPhone: string,
  code: string
): Promise<ActionResult<{ newPhone: string }>> {
  if (!newPhone || code.length !== 6) {
    return { success: false, error: 'Data tidak lengkap.' }
  }

  const normalizedPhone = normalizePhone(newPhone)

  // Periksa sekali lagi apakah ada konflik (bisa saja ada race condition)
  const conflict = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
  if (conflict && conflict.id !== userId) {
    return { success: false, error: 'Nomor ini sudah dipakai akun lain.' }
  }

  try {
    const { otpId } = await verifyOtp(normalizedPhone, code, 'VERIFY_PHONE')

    // Tandai OTP sebagai terpakai
    await prisma.otpCode.update({
      where: { id: otpId },
      data: { usedAt: new Date() },
    })

    // Update nomor di DB
    await prisma.user.update({
      where: { id: userId },
      data: { phone: normalizedPhone },
    })

    return { success: true, data: { newPhone: normalizedPhone } }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Verifikasi gagal.' }
  }
}

// ─── Update Email dari Dashboard ─────────────────────────

export async function updateUserEmail(
  userId: string,
  email: string
): Promise<ActionResult<null>> {
  const parsed = z.string().email('Format email tidak valid').safeParse(email.trim())
  if (!parsed.success) {
    return { success: false, error: 'Format email tidak valid.' }
  }

  const normalized = parsed.data.toLowerCase()

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalized } })
    if (existing && existing.id !== userId) {
      return { success: false, error: 'Email sudah digunakan akun lain.' }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email: normalized },
    })

    return { success: true, data: null }
  } catch (err) {
    return { success: false, error: 'Gagal menyimpan email.' }
  }
}

// ─── Logout ───────────────────────────────────────────────

export async function logoutAction() {
  await signOut({ redirectTo: '/login' })
}
