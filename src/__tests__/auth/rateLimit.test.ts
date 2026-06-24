// @vitest-environment node
/**
 * [8.5] Phase 8 — Rate Limiting Login tests
 * Menguji checkLoginRateLimit dari loginGuard.ts menggunakan DB fallback
 * (Redis tidak tersedia dalam test environment).
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { prisma } from '@/lib/prisma'

// Redis tidak tersedia dalam test — paksa DB fallback
vi.mock('@/lib/redis', () => ({ redis: undefined }))

import { checkLoginRateLimit } from '@/lib/auth/loginGuard'

const TEST_ID = '__test__ratelimit'

// Bersihkan login attempts test sebelum setiap test
beforeEach(async () => {
  await prisma.loginAttempt.deleteMany({
    where: { identifier: { startsWith: TEST_ID } },
  })
})

afterAll(async () => {
  await prisma.loginAttempt.deleteMany({
    where: { identifier: { startsWith: TEST_ID } },
  })
})

// Helper: tulis N percobaan gagal
async function writeFailedAttempts(
  identifier: string,
  count: number,
  ageMinutes = 5
) {
  const createdAt = new Date(Date.now() - ageMinutes * 60 * 1000)
  await prisma.loginAttempt.createMany({
    data: Array.from({ length: count }, () => ({
      identifier,
      ipAddress: '127.0.0.1',
      success: false,
      createdAt,
    })),
  })
}

// ── Tests ─────────────────────────────────────────────────

describe('[8.5] checkLoginRateLimit — DB fallback (tanpa Redis)', () => {
  it('percobaan ke-6 dalam 15 menit SELALU ditolak (throw RATE_LIMITED)', async () => {
    const id = `${TEST_ID}-block`
    // Tulis 5 percobaan gagal dalam window 15 menit
    await writeFailedAttempts(id, 5, 5)

    // Percobaan ke-6 harus ditolak
    await expect(checkLoginRateLimit(id, '127.0.0.1')).rejects.toThrow('RATE_LIMITED')
  })

  it('5 percobaan gagal LAMA (> 15 menit) tidak memblokir', async () => {
    const id = `${TEST_ID}-expired`
    // Tulis 5 percobaan gagal yang sudah 20 menit lalu (di luar window)
    await writeFailedAttempts(id, 5, 20)

    // Tidak boleh throw — window sudah expired
    await expect(checkLoginRateLimit(id, '127.0.0.1')).resolves.not.toThrow()
  })

  it('percobaan berhasil tidak dihitung dalam rate limit', async () => {
    const id = `${TEST_ID}-success`
    // 4 gagal + 1 berhasil dalam 15 menit
    await writeFailedAttempts(id, 4, 5)
    await prisma.loginAttempt.create({
      data: {
        identifier: id,
        ipAddress: '127.0.0.1',
        success: true, // berhasil — tidak dihitung
        createdAt: new Date(Date.now() - 3 * 60 * 1000),
      },
    })

    // Total 5 record tapi hanya 4 gagal → belum diblokir
    await expect(checkLoginRateLimit(id, '127.0.0.1')).resolves.not.toThrow()
  })

  it('tepat 5 percobaan gagal — BELUM diblokir (diblokir mulai ke-6)', async () => {
    const id = `${TEST_ID}-threshold`
    await writeFailedAttempts(id, 4, 5) // 4 gagal sudah ada

    // Percobaan ke-5 → belum diblokir (checkLoginRateLimit tidak throw)
    await expect(checkLoginRateLimit(id, '127.0.0.1')).resolves.not.toThrow()

    // Tambah 1 lagi → sekarang total 5 gagal di DB
    await prisma.loginAttempt.create({
      data: { identifier: id, ipAddress: '127.0.0.1', success: false, createdAt: new Date() },
    })

    // Percobaan berikutnya (ke-6) → harus ditolak
    await expect(checkLoginRateLimit(id, '127.0.0.1')).rejects.toThrow('RATE_LIMITED')
  })

  it('identifier berbeda tidak saling memblokir', async () => {
    const id1 = `${TEST_ID}-user1`
    const id2 = `${TEST_ID}-user2`

    // User1 diblokir
    await writeFailedAttempts(id1, 5, 5)
    await expect(checkLoginRateLimit(id1, '127.0.0.1')).rejects.toThrow('RATE_LIMITED')

    // User2 tidak terpengaruh
    await expect(checkLoginRateLimit(id2, '127.0.0.1')).resolves.not.toThrow()
  })
})
