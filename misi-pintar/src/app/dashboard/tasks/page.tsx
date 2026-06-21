import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'
import TasksClient from './tasks-client'

export default async function TasksPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const familySpaceId = session.user.familySpaceId!
  const now = new Date()

  const [children, tasks, subscription] = await Promise.all([
    prisma.child.findMany({
      where: { familySpaceId, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, avatar: true },
    }),
    prisma.task.findMany({
      where: { familySpaceId },
      include: { child: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.subscription.findUnique({
      where: { familySpaceId },
      include: { plan: true },
    }),
  ])

  const limits = (subscription?.plan.limits ?? { maxTasksPerMonth: 10 }) as Record<string, number>
  const maxTasksPerMonth = limits.maxTasksPerMonth ?? 10

  const tasksThisMonth = await prisma.task.count({
    where: {
      familySpaceId,
      createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Tugas</h1>
        {maxTasksPerMonth !== -1 && (
          <p className="text-gray-500 text-sm mt-1">
            {tasksThisMonth}/{maxTasksPerMonth} tugas bulan ini
          </p>
        )}
      </div>
      <TasksClient
        children={children}
        tasks={tasks as any}
        tasksThisMonth={tasksThisMonth}
        maxTasksPerMonth={maxTasksPerMonth}
      />
    </div>
  )
}
