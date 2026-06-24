import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import OnboardingWizard from './onboarding-wizard'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const familySpaceId = session.user.familySpaceId!

  const [childCount, familySpace] = await Promise.all([
    prisma.child.count({ where: { familySpaceId, deletedAt: null } }),
    prisma.familySpace.findUnique({
      where: { id: familySpaceId },
      select: { name: true, spaceCode: true },
    }),
  ])

  if (childCount > 0) redirect('/dashboard')

  return (
    <OnboardingWizard
      familyName={familySpace?.name ?? ''}
      spaceCode={familySpace?.spaceCode ?? ''}
      parentName={session.user.name ?? ''}
    />
  )
}
