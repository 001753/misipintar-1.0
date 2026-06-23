import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AVATARS } from '@/lib/utils'
import ChildrenClient from './children-client'

export default async function ChildrenPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const familySpaceId = session.user.familySpaceId!

  const [children, subscription] = await Promise.all([
    prisma.child.findMany({
      where: { familySpaceId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.subscription.findUnique({
      where: { familySpaceId },
      include: { plan: true },
    }),
  ])

  const limits = (subscription?.plan.limits ?? { maxChildren: 2 }) as Record<string, number>
  const maxChildren = limits.maxChildren ?? 2

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Anak</h1>
          <p className="text-gray-500 text-sm mt-1">
            {children.length}/{maxChildren} anak terdaftar
          </p>
        </div>
      </div>
      <ChildrenClient
        children={children}
        maxChildren={maxChildren}
        avatars={AVATARS}
      />
    </div>
  )
}
