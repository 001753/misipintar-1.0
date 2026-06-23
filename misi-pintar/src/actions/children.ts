'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { validateChildPassword } from '@/lib/auth/passwordPolicy'
import type { ActionResult } from '@/types'

// ─── Helpers ─────────────────────────────────────────────

async function getParentSession() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT' || !session.user.familySpaceId) {
    redirect('/login')
  }
  return { familySpaceId: session.user.familySpaceId! }
}

async function getPlanLimits(familySpaceId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { familySpaceId },
    include: { plan: true },
  })
  return (sub?.plan.limits ?? { maxChildren: 2, maxTasksPerMonth: 10 }) as Record<string, number>
}


// ─── Schemas ──────────────────────────────────────────────

const createChildSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(50),
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(20)
    .regex(/^[a-z0-9_]+$/, 'Username hanya boleh huruf kecil, angka, dan underscore'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  avatar: z.string().optional(),
})

// ─── [2.1a] createChild ───────────────────────────────────

export async function createChild(
  formData: FormData
): Promise<ActionResult<{ childId: string }>> {
  const { familySpaceId } = await getParentSession()

  const parsed = createChildSchema.safeParse({
    name: formData.get('name'),
    username: formData.get('username'),
    password: formData.get('password'),
    avatar: formData.get('avatar') || undefined,
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }
  }

  const { name, username, password, avatar } = parsed.data

  // [7.3] Validasi password anak via passwordPolicy
  try {
    validateChildPassword(password, username)
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Password tidak valid.' }
  }

  const limits = await getPlanLimits(familySpaceId)
  const maxChildren = limits.maxChildren ?? 2
  const currentCount = await prisma.child.count({
    where: { familySpaceId, deletedAt: null },
  })
  if (currentCount >= maxChildren) {
    return {
      success: false,
      error: `Paket Anda hanya mendukung ${maxChildren} anak. Upgrade plan untuk menambah lebih banyak.`,
    }
  }

  const existing = await prisma.child.findUnique({
    where: { familySpaceId_username: { familySpaceId, username } },
  })
  if (existing && !existing.deletedAt) {
    return { success: false, error: 'Username sudah digunakan dalam keluarga ini.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const child = await prisma.child.create({
    data: { name, username, passwordHash, avatar: avatar ?? '🧒', familySpaceId },
  })

  return { success: true, data: { childId: child.id } }
}

// ─── [2.1b] updateChild ───────────────────────────────────

export async function updateChild(
  childId: string,
  formData: FormData
): Promise<ActionResult<null>> {
  const { familySpaceId } = await getParentSession()

  const child = await prisma.child.findUnique({ where: { id: childId } })
  if (!child || child.familySpaceId !== familySpaceId || child.deletedAt) {
    return { success: false, error: 'Anak tidak ditemukan.' }
  }

  const name = formData.get('name')?.toString().trim()
  const avatar = formData.get('avatar')?.toString() || undefined

  if (!name || name.length < 2) {
    return { success: false, error: 'Nama minimal 2 karakter.' }
  }

  await prisma.child.update({ where: { id: childId }, data: { name, avatar } })
  return { success: true, data: null }
}

// ─── [2.1c] changeChildPassword ──────────────────────────

export async function changeChildPassword(
  childId: string,
  formData: FormData
): Promise<ActionResult<null>> {
  const { familySpaceId } = await getParentSession()

  const child = await prisma.child.findUnique({ where: { id: childId } })
  if (!child || child.familySpaceId !== familySpaceId || child.deletedAt) {
    return { success: false, error: 'Anak tidak ditemukan.' }
  }

  const newPassword = formData.get('newPassword')?.toString() ?? ''
  // [7.3] Validasi password anak via passwordPolicy
  try {
    validateChildPassword(newPassword, child.username)
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Password tidak valid.' }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.child.update({ where: { id: childId }, data: { passwordHash } })
  return { success: true, data: null }
}

// ─── [2.1d] deleteChild (soft delete) ────────────────────

export async function deleteChild(childId: string): Promise<ActionResult<null>> {
  const { familySpaceId } = await getParentSession()

  const child = await prisma.child.findUnique({ where: { id: childId } })
  if (!child || child.familySpaceId !== familySpaceId || child.deletedAt) {
    return { success: false, error: 'Anak tidak ditemukan.' }
  }

  await prisma.child.update({ where: { id: childId }, data: { deletedAt: new Date() } })
  return { success: true, data: null }
}

export { getPlanLimits }
