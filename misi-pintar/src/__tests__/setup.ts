import { prisma } from '@/lib/prisma'
import { beforeEach, afterAll } from 'vitest'

/**
 * [8.1] Global test setup untuk Phase 8 DB tests.
 * Menggunakan database yang sama (dev) dengan cleanup per-test.
 * vitest otomatis set NODE_ENV=test.
 */

beforeEach(async () => {
  // Bersihkan data test sebelum setiap test (urutan: FK dependents dulu)
  await prisma.$transaction([
    prisma.paymentLog.deleteMany({ where: { invoice: { midtransOrderId: { startsWith: 'TEST-' } } } }),
    prisma.invoice.deleteMany({ where: { midtransOrderId: { startsWith: 'TEST-' } } }),
    prisma.transactionLedger.deleteMany({ where: { familySpace: { name: { startsWith: '__test__' } } } }),
    prisma.task.deleteMany({ where: { familySpace: { name: { startsWith: '__test__' } } } }),
    prisma.loginAttempt.deleteMany({ where: { identifier: { startsWith: '__test__' } } }),
    prisma.notification.deleteMany({ where: { familySpace: { name: { startsWith: '__test__' } } } }),
    prisma.child.deleteMany({ where: { familySpace: { name: { startsWith: '__test__' } } } }),
    prisma.subscription.deleteMany({ where: { familySpace: { name: { startsWith: '__test__' } } } }),
    prisma.user.deleteMany({ where: { email: { startsWith: '__test__' } } }),
    prisma.familySpace.deleteMany({ where: { name: { startsWith: '__test__' } } }),
  ])
})

afterAll(async () => {
  await prisma.$disconnect()
})
