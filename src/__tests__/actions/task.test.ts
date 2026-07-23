// @vitest-environment node
/**
 * [8.2] Phase 8 — approveTask tests
 * Menguji atomisitas saldo + ledger, rollback, dan cross-tenant security.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// ── Mock auth + next/navigation + FCM/SSE ─────────────────
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))
vi.mock('@/lib/notifications/fcm', () => ({
  sendPushNotification: vi.fn().mockResolvedValue(undefined),
  getUserFcmTokens: vi.fn().mockResolvedValue([]),
  getChildFcmTokens: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/lib/notifications/sse', () => ({
  publishToFamily: vi.fn().mockResolvedValue(undefined),
  incrementUnreadBadge: vi.fn().mockResolvedValue(undefined),
}))
// Redis tidak tersedia dalam test environment
vi.mock('@/lib/redis', () => ({ redis: undefined }))
vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual<typeof import('@/lib/prisma')>('@/lib/prisma')
  const testPrisma = Object.create(actual.prisma) as typeof actual.prisma
  Object.defineProperty(testPrisma, '$transaction', {
    configurable: true,
    writable: true,
    value: actual.prisma.$transaction.bind(actual.prisma),
  })
  return { ...actual, prisma: testPrisma }
})

import { auth } from '@/lib/auth/config'
import { approveTask } from '@/actions/tasks'

// ── Test fixtures ─────────────────────────────────────────
let familySpaceId: string
let otherFamilySpaceId: string
let childId: string
let parentId: string
let otherParentId: string

const UNIQUE = `__test__task-${Date.now()}`

beforeAll(async () => {
  // Plan
  const plan = await prisma.plan.upsert({
    where: { type: 'STARTER' },
    update: {},
    create: {
      type: 'STARTER', name: 'Starter', price: 0, yearlyPrice: 0,
      currency: 'IDR', limits: { maxChildren: 2, maxTasksPerMonth: 10 },
    },
  })

  // Parent + FamilySpace
  const parent = await prisma.user.create({
    data: { email: `${UNIQUE}@test.internal`, passwordHash: await bcrypt.hash('pass', 4), name: 'Parent', role: 'PARENT' },
  })
  parentId = parent.id

  const fs = await prisma.familySpace.create({
    data: { name: `__test__task-fs-${Date.now()}`, spaceCode: `T${Date.now().toString().slice(-5)}`, ownerId: parent.id, users: { connect: { id: parent.id } } },
  })
  familySpaceId = fs.id

  await prisma.user.update({ where: { id: parent.id }, data: { familySpaceId: fs.id } })
  const exp = new Date(); exp.setFullYear(exp.getFullYear() + 100)
  await prisma.subscription.create({ data: { familySpaceId, planId: plan.id, status: 'FREE', currentPeriodStart: new Date(), currentPeriodEnd: exp } })

  // Child
  const child = await prisma.child.create({
    data: { name: 'Test Child', username: 'testchild8', passwordHash: await bcrypt.hash('pass123', 4), familySpaceId, balance: 0, savingsBalance: 0, charityBalance: 0 },
  })
  childId = child.id

  // Other FamilySpace untuk cross-tenant test
  const otherParent = await prisma.user.create({
    data: { email: `${UNIQUE}-other@test.internal`, passwordHash: await bcrypt.hash('pass', 4), name: 'Other Parent', role: 'PARENT' },
  })
  otherParentId = otherParent.id
  const otherFs = await prisma.familySpace.create({
    data: { name: `__test__task-fs-other-${Date.now()}`, spaceCode: `U${Date.now().toString().slice(-5)}`, ownerId: otherParent.id, users: { connect: { id: otherParent.id } } },
  })
  otherFamilySpaceId = otherFs.id
  await prisma.user.update({ where: { id: otherParent.id }, data: { familySpaceId: otherFs.id } })
  await prisma.subscription.create({ data: { familySpaceId: otherFamilySpaceId, planId: plan.id, status: 'FREE', currentPeriodStart: new Date(), currentPeriodEnd: exp } })
})

afterAll(async () => {
  await prisma.transactionLedger.deleteMany({ where: { familySpaceId } })
  await prisma.notification.deleteMany({ where: { familySpaceId } })
  await prisma.task.deleteMany({ where: { familySpaceId } })
  await prisma.child.deleteMany({ where: { familySpaceId } })
  await prisma.subscription.deleteMany({ where: { familySpaceId } })
  await prisma.task.deleteMany({ where: { familySpaceId: otherFamilySpaceId } })
  await prisma.child.deleteMany({ where: { familySpaceId: otherFamilySpaceId } })
  await prisma.subscription.deleteMany({ where: { familySpaceId: otherFamilySpaceId } })
  await prisma.user.updateMany({
    where: { id: { in: [parentId, otherParentId] } },
    data: { familySpaceId: null },
  })
  await prisma.familySpace.deleteMany({ where: { id: { in: [familySpaceId, otherFamilySpaceId] } } })
  await prisma.user.deleteMany({ where: { id: { in: [parentId, otherParentId] } } })
})

// ── Helper: setup task & child balance ────────────────────
async function setupTask(rewardAmount: number, initialBalance = 100) {
  await prisma.child.update({ where: { id: childId }, data: { balance: initialBalance } })
  const task = await prisma.task.create({
    data: { familySpaceId, childId, title: 'Test Task', rewardAmount, status: 'CLAIMED', claimedAt: new Date() },
  })
  return task
}

// ── Tests ─────────────────────────────────────────────────

describe('[8.2] approveTask', () => {
  it('balance anak bertambah persis rewardAmount', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: parentId, role: 'PARENT', familySpaceId, childId: null, email: 'p@test.com', name: 'Parent' },
      expires: '',
    } as any)

    const task = await setupTask(50, 100)

    const result = await approveTask(task.id)
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.newBalance).toBe(150)

    // Verifikasi DB langsung
    const child = await prisma.child.findUnique({ where: { id: childId } })
    expect(child!.balance).toBe(150)

    // 1 baris TransactionLedger TASK_REWARD
    const ledger = await prisma.transactionLedger.findFirst({
      where: { childId, type: 'TASK_REWARD', refId: task.id },
    })
    expect(ledger).not.toBeNull()
    expect(ledger!.amount).toBe(50)
    expect(ledger!.balanceBefore).toBe(100)
    expect(ledger!.balanceAfter).toBe(150)
  })

  it('rollback jika ledger insert gagal: saldo tidak berubah', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: parentId, role: 'PARENT', familySpaceId, childId: null, email: 'p@test.com', name: 'Parent' },
      expires: '',
    } as any)

    await prisma.child.update({ where: { id: childId }, data: { balance: 100 } })
    const task = await prisma.task.create({
      data: { familySpaceId, childId, title: 'Rollback Task', rewardAmount: 75, status: 'CLAIMED', claimedAt: new Date() },
    })

    // Mock prisma.$transaction untuk throw — simulasi kegagalan atomik
    const txSpy = vi.spyOn(prisma, '$transaction').mockImplementationOnce(async () => {
      throw new Error('Simulated ledger failure')
    })

    // approveTask harus melempar error (tidak swallow) karena $transaction gagal
    let errorThrown = false
    try {
      await approveTask(task.id)
    } catch {
      errorThrown = true
    }
    // approveTask gagal (lempar atau return error)
    expect(errorThrown).toBe(true)

    // PRD: saldo TIDAK berubah karena transaction di-rollback
    const childAfter = await prisma.child.findUnique({ where: { id: childId } })
    expect(childAfter!.balance).toBe(100)

    // Task masih CLAIMED (tidak terupdate karena rollback)
    const taskAfter = await prisma.task.findUnique({ where: { id: task.id } })
    expect(taskAfter!.status).toBe('CLAIMED')

    txSpy.mockRestore()
  })

  it('tidak bisa approve task milik keluarga lain (cross-tenant)', async () => {
    // Login sebagai parent dari familySpaceId
    vi.mocked(auth).mockResolvedValue({
      user: { id: parentId, role: 'PARENT', familySpaceId, childId: null, email: 'p@test.com', name: 'Parent' },
      expires: '',
    } as any)

    // Buat task di familySpace lain
    const otherChild = await prisma.child.create({
      data: { name: 'Other Child', username: 'otherchild8', passwordHash: await bcrypt.hash('pass', 4), familySpaceId: otherFamilySpaceId },
    })
    const foreignTask = await prisma.task.create({
      data: { familySpaceId: otherFamilySpaceId, childId: otherChild.id, title: 'Foreign Task', rewardAmount: 9999, status: 'CLAIMED', claimedAt: new Date() },
    })

    // Coba approve dari familySpaceId yang berbeda
    const result = await approveTask(foreignTask.id)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/tidak ditemukan/i)

    // Pastikan saldo tidak berubah
    const oc = await prisma.child.findUnique({ where: { id: otherChild.id } })
    expect(oc!.balance).toBe(0)
  })
})
