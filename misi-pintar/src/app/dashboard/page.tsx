import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ParentDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const familySpaceId = session.user.familySpaceId!

  const [familySpace, children, pendingTasks, subscription] = await Promise.all([
    prisma.familySpace.findUnique({
      where: { id: familySpaceId },
      select: { name: true, spaceCode: true },
    }),
    prisma.child.findMany({
      where: { familySpaceId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.task.findMany({
      where: { familySpaceId, status: 'CLAIMED' },
      include: { child: { select: { name: true } } },
      orderBy: { claimedAt: 'desc' },
      take: 5,
    }),
    prisma.subscription.findUnique({
      where: { familySpaceId },
      include: { plan: { select: { name: true } } },
    }),
  ])

  const totalBalance = children.reduce((sum, c) => sum + c.balance, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {session.user.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">{familySpace?.name}</p>
      </div>

      {/* Kode Keluarga */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Kode Keluarga</p>
          <p className="text-2xl font-black tracking-[0.25em] text-emerald-700 font-mono mt-1">
            {familySpace?.spaceCode}
          </p>
        </div>
        <p className="text-xs text-emerald-600 max-w-[200px] text-right">
          Bagikan kode ini ke anak untuk login ke aplikasi
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Anak" value={String(children.length)} icon="👧" />
        <StatCard label="Tugas Menunggu" value={String(pendingTasks.length)} icon="📋" />
        <StatCard label="Plan" value={subscription?.plan.name ?? 'Starter'} icon="⭐" highlight />
        <StatCard
          label="Total Saldo"
          value={`Rp ${totalBalance.toLocaleString('id-ID')}`}
          icon="💰"
        />
      </div>

      {/* Tugas menunggu */}
      {pendingTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tugas Menunggu Persetujuan ({pendingTasks.length})
          </h2>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-amber-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-500">
                    oleh {task.child.name} · Rp {task.rewardAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                  Menunggu
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daftar anak */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Anak</h2>
          <Link href="/dashboard/children" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Kelola →
          </Link>
        </div>
        {children.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-4xl mb-3">👧</p>
            <p className="text-gray-600 font-medium">Belum ada anak terdaftar</p>
            <p className="text-gray-400 text-sm mt-1">Tambah akun anak untuk mulai</p>
            <Link
              href="/dashboard/children"
              className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Tambah Anak
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {children.map((child) => (
              <div key={child.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg">
                    {child.avatar ?? '🧒'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{child.name}</p>
                    <p className="text-xs text-gray-400">@{child.username}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">Saldo</p>
                  <p className="font-bold text-emerald-600">
                    Rp {child.balance.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label, value, icon, highlight = false,
}: {
  label: string; value: string; icon: string; highlight?: boolean
}) {
  return (
    <div className={`rounded-2xl p-4 ${highlight ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200'}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className={`text-lg font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      <p className={`text-xs mt-0.5 ${highlight ? 'text-emerald-100' : 'text-gray-500'}`}>{label}</p>
    </div>
  )
}
