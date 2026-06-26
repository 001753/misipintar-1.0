export const dynamic = 'force-dynamic'
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
    <div className="animate-fade-up space-y-4 pt-4 pb-4">
      <div>
        <h1 className="text-white font-black text-xl">⚙️ Profil & Pengaturan</h1>
        <p className="text-emerald-200 text-sm mt-0.5">Ubah profil dan avatar kamu</p>
      </div>
      <ChildSettingsClient
        name={child.name}
        username={child.username}
        avatar={child.avatar ?? '🧒'}
      />
    </div>
  )
}
