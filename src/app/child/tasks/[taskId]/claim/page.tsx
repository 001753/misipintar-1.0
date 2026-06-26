export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ClaimClient from './claim-client'
import Link from 'next/link'

export default async function ClaimTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== 'CHILD') redirect('/login')

  const { taskId } = await params
  const childId = session.user.childId!
  const familySpaceId = session.user.familySpaceId!

  const task = await prisma.task.findUnique({ where: { id: taskId } })

  if (!task || task.childId !== childId || task.familySpaceId !== familySpaceId) {
    redirect('/child/tasks')
  }
  if (task.status !== 'PENDING') {
    redirect('/child/tasks')
  }

  return (
    <div className="animate-fade-up space-y-4 pt-2 pb-4">
      <div className="flex items-center gap-3">
        <Link
          href="/child/tasks"
          className="btn-press w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-sm transition-all"
        >
          ←
        </Link>
        <h2 className="text-white font-black text-lg">🎯 Klaim Misi</h2>
      </div>

      {/* Task preview card */}
      <div className="animate-scale-in bg-white rounded-3xl p-5 shadow-xl shadow-black/5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">
            🎯
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-gray-900 text-base leading-snug">{task.title}</h3>
            {task.description && (
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">{task.description}</p>
            )}
            <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl">
              <span className="text-sm font-black">+Rp {task.rewardAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      <ClaimClient task={{
        id: task.id,
        title: task.title,
        description: task.description,
        rewardAmount: task.rewardAmount,
      }} />
    </div>
  )
}
