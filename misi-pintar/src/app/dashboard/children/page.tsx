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
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">👧 Manajemen Anak</h1>
          <p className="text-gray-500 text-sm mt-1">
            <span className="font-bold text-emerald-600">{children.length}</span>/{maxChildren} anak terdaftar
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-2xl">
          <span className="text-emerald-600 text-sm font-bold">{maxChildren - children.length} slot tersisa</span>
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
