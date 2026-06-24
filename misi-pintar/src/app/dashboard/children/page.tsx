import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AVATARS } from '@/lib/utils'
import ChildrenClient from './children-client'

export default async function ChildrenPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const familySpaceId = session.user.familySpaceId!

  const [activeChildren, archivedChildren, subscription, taskCounts] = await Promise.all([
    prisma.child.findMany({
      where: { familySpaceId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.child.findMany({
      where: { familySpaceId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    }),
    prisma.subscription.findUnique({
      where: { familySpaceId },
      include: { plan: true },
    }),
    prisma.task.groupBy({
      by: ['childId', 'status'],
      where: { familySpaceId },
      _count: true,
    }),
  ])

  const limits = (subscription?.plan.limits ?? { maxChildren: 2 }) as Record<string, number>
  const maxChildren = limits.maxChildren ?? 2

  const taskCountMap: Record<string, { total: number; pending: number; approved: number }> = {}
  for (const row of taskCounts) {
    if (!taskCountMap[row.childId]) {
      taskCountMap[row.childId] = { total: 0, pending: 0, approved: 0 }
    }
    taskCountMap[row.childId].total += row._count
    if (row.status === 'PENDING' || row.status === 'CLAIMED') {
      taskCountMap[row.childId].pending += row._count
    }
    if (row.status === 'APPROVED') {
      taskCountMap[row.childId].approved += row._count
    }
  }

  return (
    <ChildrenClient
      activeChildren={activeChildren}
      archivedChildren={archivedChildren}
      maxChildren={maxChildren}
      avatars={AVATARS}
      taskCountMap={taskCountMap}
    />
  )
}
