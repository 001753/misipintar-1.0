export const dynamic = 'force-dynamic'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LedgerClient from './ledger-client'
import Link from 'next/link'

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

  const totalBalance = children.reduce((s, c) => s + c.balance, 0)

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-black text-gray-900">💰 Transfer Saldo</h1>
        <p className="text-gray-500 text-sm mt-1">
          Pindahkan saldo antar kantong anak secara aman.
        </p>
      </div>

      {children.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-1">Total Semua Saldo Anak</p>
          <p className="text-4xl font-black">Rp {totalBalance.toLocaleString('id-ID')}</p>
          <p className="text-emerald-200 text-sm mt-1">{children.length} anak terdaftar</p>
        </div>
      )}

      {children.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">👧</p>
          <p className="text-gray-700 font-bold">Belum ada anak terdaftar</p>
          <p className="text-gray-400 text-sm mt-1">Tambah anak terlebih dahulu</p>
          <Link href="/dashboard/children"
            className="btn-press inline-block mt-4 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold rounded-2xl shadow-md">
            + Tambah Anak
          </Link>
        </div>
      ) : (
        <LedgerClient children={children} />
      )}
    </div>
  )
}
