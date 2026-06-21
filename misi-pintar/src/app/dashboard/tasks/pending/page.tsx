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
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/tasks" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Menunggu Persetujuan
          {tasks.length > 0 && (
            <span className="ml-2 text-sm bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {tasks.length}
            </span>
          )}
        </h1>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-gray-600 font-medium">Tidak ada tugas yang perlu disetujui</p>
          <p className="text-gray-400 text-sm mt-1">Semua tugas sudah diproses!</p>
        </div>
      ) : (
        <PendingTasksClient tasks={tasks as any} />
      )}
    </div>
  )
}
