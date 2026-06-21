import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ChildTasksPage() {
  const session = await auth()
  if (!session || session.user.role !== 'CHILD') redirect('/login')

  const childId = session.user.childId!
  const familySpaceId = session.user.familySpaceId!

  const tasks = await prisma.task.findMany({
    where: { childId, familySpaceId },
    orderBy: { createdAt: 'desc' },
  })

  const statusLabel: Record<string, string> = {
    PENDING: 'Tersedia',
    CLAIMED: 'Menunggu Persetujuan',
    APPROVED: 'Selesai',
    REJECTED: 'Ditolak',
  }
  const statusColor: Record<string, string> = {
    PENDING: 'bg-emerald-100 text-emerald-700',
    CLAIMED: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    REJECTED: 'bg-red-100 text-red-600',
  }

  const pendingTasks = tasks.filter((t) => t.status === 'PENDING')
  const otherTasks = tasks.filter((t) => t.status !== 'PENDING')

  return (
    <div className="space-y-4 pt-2">
      <h2 className="text-white font-bold text-lg">Semua Tugas</h2>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-gray-500 text-sm">Belum ada tugas untuk kamu</p>
        </div>
      ) : (
        <>
          {pendingTasks.length > 0 && (
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide mb-2">
                Tugas Tersedia ({pendingTasks.length})
              </p>
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                        )}
                        <p className="text-emerald-600 font-bold text-sm mt-2">
                          +Rp {task.rewardAmount.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <Link
                        href={`/child/tasks/${task.id}/claim`}
                        className="shrink-0 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-xl hover:bg-emerald-700 transition-colors"
                      >
                        Klaim →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherTasks.length > 0 && (
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide mb-2">
                Riwayat Tugas
              </p>
              <div className="space-y-2">
                {otherTasks.map((task) => (
                  <div key={task.id} className="bg-white/80 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                      <p className="text-xs text-emerald-600 font-semibold">
                        Rp {task.rewardAmount.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[task.status]}`}>
                      {statusLabel[task.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
