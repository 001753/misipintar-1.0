// @vitest-environment node
/**
 * [8.3] Phase 8 — transferToSavings tests
 * Menguji atomisitas transfer, penolakan saldo kurang, dan validasi amount.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// ── Mock auth + dependencies ──────────────────────────────
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))
vi.mock('@/lib/redis', () => ({ redis: undefined }))

import { auth } from '@/lib/auth/config'
import { transferToSavings } from '@/actions/ledger'

// ── Test fixtures ─────────────────────────────────────────
let familySpaceId: string
let childId: string
let parentId: string

const UNIQUE = `__test__savings-${Date.now()}`

beforeAll(async () => {
  const plan = await prisma.plan.upsert({
    where: { type: 'STARTER' },
    update: {},
    create: { type: 'STARTER', name: 'Starter', price: 0, yearlyPrice: 0, currency: 'IDR', limits: { maxChildren: 2, maxTasksPerMonth: 10 } },
  })

  const parent = await prisma.user.create({
    data: { email: `${UNIQUE}@test.internal`, passwordHash: await bcrypt.hash('pass', 4), name: 'Parent', role: 'PARENT' },
  })
  parentId = parent.id

  const fs = await prisma.familySpace.create({
    data: { name: `__test__savings-fs-${Date.now()}`, spaceCode: `S${Date.now().toString().slice(-5)}`, ownerId: parent.id, users: { connect: { id: parent.id } } },
  })
  familySpaceId = fs.id

  await prisma.user.update({ where: { id: parent.id }, data: { familySpaceId: fs.id } })
  const exp = new Date(); exp.setFullYear(exp.getFullYear() + 100)
  await prisma.subscription.create({ data: { familySpaceId, planId: plan.id, status: 'FREE', currentPeriodStart: new Date(), currentPeriodEnd: exp } })

  const child = await prisma.child.create({
    data: { name: 'Savings Child', username: 'savingskid8', passwordHash: await bcrypt.hash('pass123', 4), familySpaceId, balance: 0, savingsBalance: 0, charityBalance: 0 },
  })
  childId = child.id
})

afterAll(async () => {
  await prisma.transactionLedger.deleteMany({ where: { familySpaceId } })
  await prisma.notification.deleteMany({ where: { familySpaceId } })
  await prisma.child.deleteMany({ where: { familySpaceId } })
  await prisma.subscription.deleteMany({ where: { familySpaceId } })
  await prisma.familySpace.deleteMany({ where: { id: familySpaceId } })
  await prisma.user.deleteMany({ where: { email: { startsWith: UNIQUE } } })
})

// Helper: reset child balance
async function resetBalance(balance: number, savingsBalance = 0) {
  await prisma.child.update({ where: { id: childId }, data: { balance, savingsBalance, charityBalance: 0 } })
  await prisma.transactionLedger.deleteMany({ where: { childId } })
}

// ── Tests ─────────────────────────────────────────────────

describe('[8.3] transferToSavings', () => {
  it('transfer valid — atomik (balance turun, savingsBalance naik, 2 ledger)', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: parentId, role: 'PARENT', familySpaceId, childId: null },
      expires: '',
    } as any)

    await resetBalance(100, 0)
    const result = await transferToSavings(childId, 60)

    expect('success' in result && result.success).toBe(true)
    if (!('success' in result)) return

    expect(result.newBalance).toBe(40)
    expect(result.newSavingsBalance).toBe(60)

    // Verifikasi DB langsung
    const child = await prisma.child.findUnique({ where: { id: childId } })
    expect(child!.balance).toBe(40)
    expect(child!.savingsBalance).toBe(60)

    // 2 baris TransactionLedger (SAVINGS_DEPOSIT + ADJUSTMENT)
    const ledgerCount = await prisma.transactionLedger.count({ where: { childId } })
    expect(ledgerCount).toBe(2)

    const savingsEntry = await prisma.transactionLedger.findFirst({ where: { childId, type: 'SAVINGS_DEPOSIT' } })
    expect(savingsEntry).not.toBeNull()
    expect(savingsEntry!.amount).toBe(60)
  })

  it('transfer melebihi saldo — DITOLAK tanpa perubahan apapun', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: parentId, role: 'PARENT', familySpaceId, childId: null },
      expires: '',
    } as any)

    await resetBalance(50, 0)
    const before = await prisma.child.findUnique({ where: { id: childId } })

    const result = await transferToSavings(childId, 100)

    expect('error' in result).toBe(true)
    if (!('error' in result)) return
    expect(result.error).toBe('INSUFFICIENT_BALANCE')

    // Verifikasi DB: saldo TIDAK berubah
    const after = await prisma.child.findUnique({ where: { id: childId } })
    expect(after!.balance).toBe(50)
    expect(after!.savingsBalance).toBe(0)

    // TIDAK ada baris baru di TransactionLedger
    const ledgerCount = await prisma.transactionLedger.count({ where: { childId } })
    expect(ledgerCount).toBe(0)
  })

  it('amount negatif ditolak', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: parentId, role: 'PARENT', familySpaceId, childId: null },
      expires: '',
    } as any)

    await resetBalance(100)
    const result = await transferToSavings(childId, -10)

    expect('error' in result).toBe(true)
    if (!('error' in result)) return
    expect(result.error).toBe('INVALID_AMOUNT')
  })

  it('amount nol ditolak', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: parentId, role: 'PARENT', familySpaceId, childId: null },
      expires: '',
    } as any)

    await resetBalance(100)
    const result = await transferToSavings(childId, 0)

    expect('error' in result).toBe(true)
    if (!('error' in result)) return
    expect(result.error).toBe('INVALID_AMOUNT')
  })
})
