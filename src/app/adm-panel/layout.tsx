import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAdminLandingPath } from '@/lib/auth/admin-redirect'

export const metadata = {
  title: 'Admin Panel — Misi Pintar',
  robots: 'noindex, nofollow',
}

export const dynamic = 'force-dynamic'

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (session?.user.role === 'SUPER_ADMIN') redirect('/superadmin')
  if (session?.user.role === 'PARENT') {
    const memberships = await prisma.schoolMembership.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
        role: { in: ['OWNER', 'ADMIN'] },
      },
      select: { school: { select: { slug: true, status: true } } },
      orderBy: { createdAt: 'asc' },
    })
    const destination = getAdminLandingPath(
      session.user.role,
      memberships.map(({ school }) => school),
    )
    if (destination) redirect(destination)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {children}
    </div>
  )
}
