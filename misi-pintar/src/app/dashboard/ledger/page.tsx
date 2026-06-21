import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LedgerClient from './ledger-client'

export default async function LedgerPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const familySpaceId = session.user.familySpaceId!

  const children = await prisma.child.findMany({
    where: { familySpaceId, deletedAt: null },
    select: {
      id: true,
      name: true,
      avatar: true,
      balance: true,
      savingsBalance: true,
      charityBalance: true,
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transfer Saldo</h1>
        <p className="text-gray-500 text-sm mt-1">
          Pindahkan saldo antar kantong — semua kalkulasi dilakukan di server.
        </p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">👧</p>
          <p className="text-gray-600 font-medium">Belum ada anak terdaftar</p>
          <p className="text-gray-400 text-sm mt-1">
            Tambah anak terlebih dahulu di halaman{' '}
            <a href="/dashboard/children" className="text-emerald-600 hover:underline">
              Anak
            </a>
          </p>
        </div>
      ) : (
        <LedgerClient children={children} />
      )}
    </div>
  )
}
