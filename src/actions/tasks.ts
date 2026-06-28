'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { startOfMonth, endOfMonth } from 'date-fns'
import type { ActionResult } from '@/types'
import { sendPushNotification, getUserFcmTokens, getChildFcmTokens } from '@/lib/notifications/fcm'
import { publishToFamily, incrementUnreadBadge } from '@/lib/notifications/sse'
import { canCreateTask } from '@/lib/plan-limits'

// ─── Helpers ─────────────────────────────────────────────

async function getParentSession() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT' || !session.user.familySpaceId) {
    redirect('/login')
  }
  return { familySpaceId: session.user.familySpaceId!, userId: session.user.id }
}

async function getChildSession() {
  const session = await auth()
  if (!session || session.user.role !== 'CHILD' || !session.user.childId || !session.user.familySpaceId) {
    redirect('/login')
  }
  return { childId: session.user.childId!, familySpaceId: session.user.familySpaceId! }
}

// ─── [2.2a] createTask ───────────────────────────────────

const createTaskSchema = z.object({
  childId: z.string().uuid('Child ID tidak valid'),
  title: z.string().min(3, 'Judul minimal 3 karakter').max(100),
  description: z.string().max(500).optional(),
  rewardAmount: z.coerce.number().int().positive('Reward harus lebih dari 0'),
})

export async function createTask(
  formData: FormData
): Promise<ActionResult<{ taskId: string }>> {
  const { familySpaceId } = await getParentSession()

  const parsed = createTaskSchema.safeParse({
    childId: formData.get('childId'),
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    rewardAmount: formData.get('rewardAmount'),
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }
  }

  const { childId, title, description, rewardAmount } = parsed.data

  // Anti cross-tenant: pastikan child milik familySpace ini
  const child = await prisma.child.findUnique({ where: { id: childId } })
  if (!child || child.familySpaceId !== familySpaceId || child.deletedAt) {
    return { success: false, error: 'Anak tidak ditemukan.' }
  }

  // Cek limit tugas bulan ini — respects phaseMode dari AppConfig
  const now = new Date()
  const taskCount = await prisma.task.count({
    where: {
      familySpaceId,
      createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
    },
  })
  const { allowed: taskAllowed, reason: taskReason } = await canCreateTask(familySpaceId, taskCount)
  if (!taskAllowed) return { success: false, error: taskReason! }

  const task = await prisma.task.create({
    data: { familySpaceId, childId, title, description, rewardAmount, status: 'PENDING' },
  })

  return { success: true, data: { taskId: task.id } }
}

// ─── [2.2b] claimTask ────────────────────────────────────
// [5.3] claimTask → FCM ke parent + SSE ke parent dashboard

export async function claimTask(
  taskId: string,
  proofPhotoUrl?: string
): Promise<ActionResult<null>> {
  const { childId, familySpaceId } = await getChildSession()

  const task = await prisma.task.findUnique({ where: { id: taskId } })

  // Validasi: task milik child ini dan familySpace ini
  if (!task || task.childId !== childId || task.familySpaceId !== familySpaceId) {
    return { success: false, error: 'Tugas tidak ditemukan.' }
  }
  if (task.status !== 'PENDING') {
    return { success: false, error: 'Tugas ini tidak bisa diklaim saat ini.' }
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'CLAIMED',
      claimedAt: new Date(),
      proofPhotoUrl: proofPhotoUrl ?? null,
    },
  })

  // Notifikasi ke parent (non-fatal — gagal tidak membatalkan klaim)
  try {
    const familySpace = await prisma.familySpace.findUnique({
      where: { id: familySpaceId },
      select: { ownerId: true, name: true },
    })
    const parentId = familySpace?.ownerId

    if (parentId) {
      const notifTitle = 'Tugas Diklaim! 📋'
      const notifBody = `${task.title} sedang menunggu persetujuan Anda.`

      // 1. Simpan ke DB Notification
      await prisma.notification.create({
        data: {
          familySpaceId,
          userId: parentId,
          title: notifTitle,
          body: notifBody,
          type: 'TASK_CLAIMED',
        },
      })

      // 2. Increment unread badge counter di Redis
      await incrementUnreadBadge(parentId)

      // 3. SSE real-time ke parent dashboard
      await publishToFamily(familySpaceId, {
        type: 'task_claimed',
        payload: { taskId, taskTitle: task.title },
      })

      // 4. FCM push ke perangkat parent
      const tokens = await getUserFcmTokens(parentId)
      if (tokens.length > 0) {
        await sendPushNotification(tokens, notifTitle, notifBody, {
          type: 'TASK_CLAIMED',
          taskId,
        })
      }
    }
  } catch (err) {
    console.error('[claimTask] Notification error (non-fatal):', err)
  }

  return { success: true, data: null }
}

// ─── [2.2c] approveTask ───────────────────────────────────
// WAJIB: prisma.$transaction() — saldo + ledger atomik
// [5.3] approveTask → FCM ke child + SSE ke parent dashboard

export async function approveTask(
  taskId: string
): Promise<ActionResult<{ newBalance: number }>> {
  const { familySpaceId } = await getParentSession()

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { child: true },
  })

  if (!task || task.familySpaceId !== familySpaceId) {
    return { success: false, error: 'Tugas tidak ditemukan.' }
  }
  if (task.status !== 'CLAIMED') {
    return { success: false, error: 'Hanya tugas yang sudah diklaim yang bisa disetujui.' }
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update status tugas
    await tx.task.update({
      where: { id: taskId },
      data: { status: 'APPROVED', approvedAt: new Date() },
    })

    // 2. Baca saldo anak dalam transaksi yang sama (untuk konsistensi)
    const child = await tx.child.findUnique({ where: { id: task.childId } })
    if (!child) throw new Error('Child not found in transaction')

    const balanceBefore = child.balance
    const balanceAfter = balanceBefore + task.rewardAmount

    // 3. Update saldo anak
    await tx.child.update({
      where: { id: task.childId },
      data: { balance: balanceAfter },
    })

    // 4. Buat baris TransactionLedger (IMMUTABLE — tidak ada delete/update)
    await tx.transactionLedger.create({
      data: {
        familySpaceId,
        childId: task.childId,
        type: 'TASK_REWARD',
        amount: task.rewardAmount,
        balanceBefore,
        balanceAfter,
        description: `Reward tugas: ${task.title}`,
        refId: taskId,
      },
    })

    // 5. Notifikasi DB untuk child (tanpa userId karena child bukan User)
    await tx.notification.create({
      data: {
        familySpaceId,
        title: 'Tugas Disetujui! 🎉',
        body: `Kamu mendapat Rp ${task.rewardAmount.toLocaleString('id-ID')} dari tugas "${task.title}"`,
        type: 'TASK_APPROVED',
      },
    })

    return { balanceAfter, childId: task.childId }
  })

  // Non-fatal: FCM + SSE setelah transaksi selesai
  try {
    const notifTitle = 'Tugas Disetujui! 🎉'
    const notifBody = `Kamu mendapat Rp ${task.rewardAmount.toLocaleString('id-ID')} dari tugas "${task.title}"`

    // SSE real-time (balance update ke parent dashboard)
    await publishToFamily(familySpaceId, {
      type: 'task_approved',
      payload: {
        taskId,
        taskTitle: task.title,
        reward: task.rewardAmount,
        newBalance: result.balanceAfter,
        childId: result.childId,
      },
    })

    // FCM ke perangkat child
    const childTokens = await getChildFcmTokens(result.childId)
    if (childTokens.length > 0) {
      await sendPushNotification(childTokens, notifTitle, notifBody, {
        type: 'TASK_APPROVED',
        taskId,
      })
    }
  } catch (err) {
    console.error('[approveTask] Notification error (non-fatal):', err)
  }

  return { success: true, data: { newBalance: result.balanceAfter } }
}

// ─── [2.2d] rejectTask ───────────────────────────────────
// [5.3] rejectTask → FCM ke child

export async function rejectTask(
  taskId: string,
  reason: string
): Promise<ActionResult<null>> {
  const { familySpaceId } = await getParentSession()

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task || task.familySpaceId !== familySpaceId) {
    return { success: false, error: 'Tugas tidak ditemukan.' }
  }
  if (task.status !== 'CLAIMED') {
    return { success: false, error: 'Hanya tugas yang sudah diklaim yang bisa ditolak.' }
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedReason: reason.trim() || 'Tidak ada alasan.',
    },
  })

  // Non-fatal: Notifikasi DB + FCM ke child
  try {
    const notifTitle = 'Tugas Ditolak 😔'
    const notifBody = `Tugas "${task.title}" ditolak. Alasan: ${reason.trim() || 'Tidak ada alasan.'}`

    await prisma.notification.create({
      data: {
        familySpaceId,
        title: notifTitle,
        body: notifBody,
        type: 'TASK_REJECTED',
      },
    })

    // FCM ke child
    const childTokens = await getChildFcmTokens(task.childId)
    if (childTokens.length > 0) {
      await sendPushNotification(childTokens, notifTitle, notifBody, {
        type: 'TASK_REJECTED',
        taskId,
      })
    }
  } catch (err) {
    console.error('[rejectTask] Notification error (non-fatal):', err)
  }

  return { success: true, data: null }
}
