import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProfileSettingsClient from './ProfileSettingsClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session || session.user.role === 'CHILD') redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, phone: true, email: true, role: true },
  })

  if (!user) redirect('/login')

  return <ProfileSettingsClient user={user} />
}
