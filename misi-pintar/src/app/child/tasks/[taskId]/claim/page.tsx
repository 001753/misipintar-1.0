import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ClaimClient from './claim-client'

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

  // Anti cross-tenant: task harus milik child ini
  if (!task || task.childId !== childId || task.familySpaceId !== familySpaceId) {
    redirect('/child/tasks')
  }
  if (task.status !== 'PENDING') {
    redirect('/child/tasks')
  }

  return (
    <div className="pt-2 space-y-4">
      <h2 className="text-white font-bold text-lg">Klaim Tugas</h2>
      <ClaimClient task={{ id: task.id, title: task.title, description: task.description, rewardAmount: task.rewardAmount }} />
    </div>
  )
}
