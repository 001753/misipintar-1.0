export const dynamic = 'force-dynamic'
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
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">📋 Manajemen Tugas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {maxTasksPerMonth === -1 ? (
              <span className="text-emerald-600 font-semibold">✨ Tugas tidak terbatas</span>
            ) : (
              <>
                <span className="font-bold text-emerald-600">{tasksThisMonth}</span>
                <span className="text-gray-400">/{maxTasksPerMonth} tugas bulan ini</span>
              </>
            )}
          </p>
        </div>
        {maxTasksPerMonth !== -1 && (
          <div className="flex-shrink-0 bg-gray-100 rounded-2xl px-3 py-2 text-center">
            <div className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                style={{ width: `${Math.min((tasksThisMonth / maxTasksPerMonth) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1 font-medium">{Math.round((tasksThisMonth / maxTasksPerMonth) * 100)}% terpakai</p>
          </div>
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
