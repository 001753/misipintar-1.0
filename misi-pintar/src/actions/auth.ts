'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { signIn, signOut } from '@/lib/auth/config'
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
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  familyName: z.string().min(2, 'Nama keluarga minimal 2 karakter'),
})

export async function registerFamilySpace(
  formData: FormData
): Promise<ActionResult<{ spaceCode: string }>> {
  const parsed = registerSchema.safeParse({
    ownerName: formData.get('ownerName'),
    email: formData.get('email'),
    password: formData.get('password'),
    familyName: formData.get('familyName'),
  })

  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? 'Data tidak valid'
    return { success: false, error: firstError }
  }

  const { ownerName, email, password, familyName } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'Email sudah terdaftar.' }
  }

  const [passwordHash, spaceCode, starterPlan] = await Promise.all([
    bcrypt.hash(password, 12),
    generateUniqueSpaceCode(),
    prisma.plan.findUnique({ where: { type: 'STARTER' } }),
  ])

  if (!starterPlan) {
    return { success: false, error: 'Konfigurasi plan belum siap. Hubungi admin.' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Buat User dulu (perlu id untuk FamilySpace.ownerId)
      const owner = await tx.user.create({
        data: {
          name: ownerName,
          email,
          passwordHash,
          role: 'PARENT',
        },
      })

      // 2. Buat FamilySpace dengan ownerId
      const familySpace = await tx.familySpace.create({
        data: {
          name: familyName,
          spaceCode,
          ownerId: owner.id,
          users: { connect: { id: owner.id } },
        },
      })

      // 3. Update user dengan familySpaceId
      await tx.user.update({
        where: { id: owner.id },
        data: { familySpaceId: familySpace.id },
      })

      // 4. Buat Subscription FREE — currentPeriodEnd 100 tahun
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
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    })
    return { success: true, data: null }
  } catch (err: any) {
    const msg = err?.message ?? ''
    if (msg.includes('TOO_MANY_ATTEMPTS')) {
      return {
        success: false,
        error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
      }
    }
    return { success: false, error: 'Email atau password salah.' }
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
    if (msg.includes('TOO_MANY_ATTEMPTS')) {
      return {
        success: false,
        error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
      }
    }
    return { success: false, error: 'Kode keluarga, username, atau password salah.' }
  }
}

// ─── Logout ───────────────────────────────────────────────

export async function logoutAction() {
  await signOut({ redirectTo: '/login' })
}
