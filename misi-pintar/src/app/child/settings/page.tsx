import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ChildSettingsClient from './child-settings-client'

export default async function ChildSettingsPage() {
  const session = await auth()
  if (!session || session.user.role !== 'CHILD' || !session.user.childId) {
    redirect('/login')
  }

  const child = await prisma.child.findUnique({
    where: { id: session.user.childId },
    select: { name: true, username: true, avatar: true },
  })

  if (!child) redirect('/login')

  return (
    <div className="pt-4">
      <h1 className="text-white font-bold text-xl mb-4">⚙️ Pengaturan</h1>
      <ChildSettingsClient
        name={child.name}
        username={child.username}
        avatar={child.avatar ?? '🧒'}
      />
    </div>
  )
}
