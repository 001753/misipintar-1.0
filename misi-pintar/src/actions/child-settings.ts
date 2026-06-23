'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { validateChildPassword } from '@/lib/auth/passwordPolicy'
import type { ActionResult } from '@/types'

async function getChildSession() {
  const session = await auth()
  if (!session || session.user.role !== 'CHILD' || !session.user.childId) {
    redirect('/login')
  }
  return { childId: session.user.childId! }
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password lama wajib diisi'),
    newPassword: z
      .string()
      .min(6, 'Password baru minimal 6 karakter')
      .max(72, 'Password terlalu panjang'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Password baru dan konfirmasi tidak cocok',
    path: ['confirmPassword'],
  })

// ─── [7] childChangeOwnPassword ──────────────────────────
// Anak bisa ganti password sendiri dari halaman Settings

export async function childChangeOwnPassword(
  formData: FormData
): Promise<ActionResult<null>> {
  const { childId } = await getChildSession()

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }
  }

  const { currentPassword, newPassword } = parsed.data

  const child = await prisma.child.findUnique({ where: { id: childId } })
  if (!child || child.deletedAt) {
    return { success: false, error: 'Akun tidak ditemukan.' }
  }

  // Validasi password lama
  const validCurrent = await bcrypt.compare(currentPassword, child.passwordHash)
  if (!validCurrent) {
    return { success: false, error: 'Password lama tidak benar.' }
  }

  // [7.3] Validasi via passwordPolicy
  try {
    validateChildPassword(newPassword, child.username)
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Password tidak valid.' }
  }

  // [7] Validasi: password baru tidak boleh sama dengan password lama
  const sameAsOld = await bcrypt.compare(newPassword, child.passwordHash)
  if (sameAsOld) {
    return { success: false, error: 'Password baru tidak boleh sama dengan password lama.' }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.child.update({ where: { id: childId }, data: { passwordHash } })

  return { success: true, data: null }
}

// ─── [8] updateChildAvatar ────────────────────────────────
// Anak upload/ganti avatar sendiri (base64 JPEG, sudah dikompres di client)

export async function updateChildAvatar(
  base64: string
): Promise<ActionResult<null>> {
  const { childId } = await getChildSession()

  if (
    !base64.startsWith('data:image/jpeg;base64,') &&
    !base64.startsWith('data:image/png;base64,') &&
    !base64.startsWith('data:image/webp;base64,')
  ) {
    return { success: false, error: 'Format gambar tidak valid.' }
  }

  if (base64.length > 300 * 1024) {
    return { success: false, error: 'Ukuran foto terlalu besar. Coba foto lain.' }
  }

  await prisma.child.update({
    where: { id: childId },
    data: { avatar: base64 },
  })

  return { success: true, data: null }
}
