export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import PendingTasksClient from './pending-client'

export default async function PendingTasksPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const familySpaceId = session.user.familySpaceId!

  const tasks = await prisma.task.findMany({
    where: { familySpaceId, status: 'CLAIMED' },
    include: { child: { select: { name: true, avatar: true } } },
    orderBy: { claimedAt: 'asc' },
  })

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/tasks"
          className="btn-press flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-semibold bg-white border border-gray-200 px-3 py-2 rounded-xl transition-all shadow-sm"
        >
          ← Kembali
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            ⏳ Menunggu Review
            {tasks.length > 0 && (
              <span className="text-sm bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-bold">
                {tasks.length}
              </span>
            )}
          </h1>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center animate-scale-in">
          <p className="text-5xl mb-3">🎉</p>
          <p className="text-gray-700 font-bold">Tidak ada tugas yang perlu disetujui</p>
          <p className="text-gray-400 text-sm mt-1">Semua sudah diproses!</p>
        </div>
      ) : (
        <PendingTasksClient tasks={tasks as any} />
      )}
    </div>
  )
}
