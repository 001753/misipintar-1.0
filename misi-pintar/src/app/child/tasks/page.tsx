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
    PENDING:  '🟢 Tersedia',
    CLAIMED:  '⏳ Menunggu',
    APPROVED: '✅ Selesai',
    REJECTED: '❌ Ditolak',
  }
  const statusStyle: Record<string, string> = {
    PENDING:  'bg-emerald-100 text-emerald-700',
    CLAIMED:  'bg-amber-100 text-amber-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    REJECTED: 'bg-red-100 text-red-600',
  }

  const pendingTasks = tasks.filter((t) => t.status === 'PENDING')
  const otherTasks   = tasks.filter((t) => t.status !== 'PENDING')

  return (
    <div className="space-y-4 pt-2 pb-4">
      {/* Header */}
      <div className="animate-fade-up">
        <h2 className="text-white font-black text-xl">🎯 Semua Misi</h2>
        <p className="text-emerald-200 text-sm mt-0.5">{tasks.length} misi total</p>
      </div>

      {tasks.length === 0 ? (
        <div className="animate-scale-in bg-white rounded-3xl p-10 text-center shadow-xl">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-700 font-bold">Belum ada misi untukmu</p>
          <p className="text-gray-400 text-sm mt-1">Minta orang tua untuk menambahkan misi</p>
        </div>
      ) : (
        <>
          {/* Available Tasks */}
          {pendingTasks.length > 0 && (
            <div className="animate-fade-up delay-100">
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-2.5 px-1">
                ✨ Tersedia ({pendingTasks.length})
              </p>
              <div className="space-y-3">
                {pendingTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className={`animate-fade-up bg-white rounded-3xl p-5 shadow-lg shadow-black/5 delay-${(i + 1) * 100}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-xl shrink-0">
                        🎯
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-sm leading-snug">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-emerald-600 font-black text-base">
                            +Rp {task.rewardAmount.toLocaleString('id-ID')}
                          </p>
                          <Link
                            href={`/child/tasks/${task.id}/claim`}
                            className="btn-press px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-100 transition-all"
                          >
                            Klaim →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {otherTasks.length > 0 && (
            <div className="animate-fade-up delay-200">
              <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-2.5 px-1">
                📜 Riwayat ({otherTasks.length})
              </p>
              <div className="space-y-2">
                {otherTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className={`animate-fade-up bg-white/90 backdrop-blur-sm rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm delay-${(i + 1) * 50}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{task.title}</p>
                      <p className="text-xs text-emerald-600 font-black mt-0.5">
                        Rp {task.rewardAmount.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0 ${statusStyle[task.status]}`}>
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
