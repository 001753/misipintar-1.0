/**
 * Shared plan-limit helpers — satu-satunya tempat untuk logika limit dan phaseMode.
 *
 * PhaseMode behaviour:
 *  FULL_FREE  — semua fitur gratis, limit dinonaktifkan (masa promosi / beta)
 *  FREEMIUM   — STARTER gratis dengan limit, PRO+ berbayar untuk fitur lebih
 *  PAID_ONLY  — semua plan butuh pembayaran (termasuk STARTER)
 */

import { prisma } from '@/lib/prisma'

// ── Tipe ────────────────────────────────────────────────────────────────────

export type PhaseMode = 'FULL_FREE' | 'FREEMIUM' | 'PAID_ONLY'

export interface PlanLimits {
  maxChildren:      number   // -1 = unlimited
  maxTasksPerMonth: number   // -1 = unlimited
  hasInterest:      boolean
  hasTax:           boolean
  maxFamilies?:     number
}

// ── Konstanta ────────────────────────────────────────────────────────────────

const ACTIVE_SUB_STATUSES = new Set(['TRIAL', 'FREE', 'PRO', 'EDUCATOR', 'SCHOOL'])

const STARTER_LIMITS: PlanLimits = {
  maxChildren:      2,
  maxTasksPerMonth: 10,
  hasInterest:      false,
  hasTax:           false,
}

const UNLIMITED: PlanLimits = {
  maxChildren:      -1,
  maxTasksPerMonth: -1,
  hasInterest:      true,
  hasTax:           true,
}

// ── Helpers internal ─────────────────────────────────────────────────────────

async function fetchPhaseMode(): Promise<PhaseMode> {
  try {
    const cfg = await prisma.appConfig.findUnique({
      where: { id: 'global-config' },
      select: { phaseMode: true },
    })
    return (cfg?.phaseMode as PhaseMode) ?? 'FREEMIUM'
  } catch {
    return 'FREEMIUM'
  }
}

// ── Export utama ─────────────────────────────────────────────────────────────

/**
 * Kembalikan limit efektif untuk sebuah familySpace.
 * Sudah memperhitungkan phaseMode dari AppConfig.
 */
export async function getPlanLimits(familySpaceId: string): Promise<PlanLimits> {
  const [phaseMode, sub] = await Promise.all([
    fetchPhaseMode(),
    prisma.subscription.findUnique({
      where:   { familySpaceId },
      include: { plan: true },
    }),
  ])

  // Mode promosi: semua keluarga dapat fitur unlimited
  if (phaseMode === 'FULL_FREE') return UNLIMITED

  // Langganan tidak ada atau sudah expired/cancelled → fallback ke STARTER limit
  if (!sub || !ACTIVE_SUB_STATUSES.has(sub.status)) return STARTER_LIMITS

  const limits = sub.plan.limits as Record<string, unknown> | null
  if (!limits) return STARTER_LIMITS

  return {
    maxChildren:      typeof limits.maxChildren      === 'number' ? limits.maxChildren      : STARTER_LIMITS.maxChildren,
    maxTasksPerMonth: typeof limits.maxTasksPerMonth === 'number' ? limits.maxTasksPerMonth : STARTER_LIMITS.maxTasksPerMonth,
    hasInterest:      typeof limits.hasInterest      === 'boolean' ? limits.hasInterest     : false,
    hasTax:           typeof limits.hasTax           === 'boolean' ? limits.hasTax          : false,
    maxFamilies:      typeof limits.maxFamilies      === 'number' ? limits.maxFamilies      : undefined,
  }
}

/**
 * Cek apakah sebuah familySpace boleh tambah anak lagi.
 * Return { allowed: true } atau { allowed: false, reason: string }
 */
export async function canAddChild(
  familySpaceId: string,
  currentActiveCount: number,
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getPlanLimits(familySpaceId)
  if (limits.maxChildren === -1) return { allowed: true }
  if (currentActiveCount >= limits.maxChildren) {
    return {
      allowed: false,
      reason: `Paket Anda hanya mendukung maksimal ${limits.maxChildren} anak aktif. Upgrade ke Pro untuk lebih banyak.`,
    }
  }
  return { allowed: true }
}

/**
 * Cek apakah sebuah familySpace boleh buat task baru bulan ini.
 */
export async function canCreateTask(
  familySpaceId: string,
  currentMonthCount: number,
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = await getPlanLimits(familySpaceId)
  if (limits.maxTasksPerMonth === -1) return { allowed: true }
  if (currentMonthCount >= limits.maxTasksPerMonth) {
    return {
      allowed: false,
      reason: `Batas ${limits.maxTasksPerMonth} misi/bulan tercapai. Upgrade ke Pro untuk misi tanpa batas.`,
    }
  }
  return { allowed: true }
}

export { ACTIVE_SUB_STATUSES, STARTER_LIMITS, UNLIMITED }
