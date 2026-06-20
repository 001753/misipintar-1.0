import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { logoutAction } from '@/actions/auth'

export default async function ChildDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'CHILD') redirect('/login')

  const childId = session.user.childId!
  const familySpaceId = session.user.familySpaceId!

  const [child, tasks] = await Promise.all([
    prisma.child.findUnique({
      where: { id: childId },
      include: { familySpace: { select: { name: true } } },
    }),
    prisma.task.findMany({
      where: { childId, familySpaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  if (!child) redirect('/login')

  const pendingTasks = tasks.filter((t) => t.status === 'PENDING')

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-400 to-emerald-600">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-white">
          <span className="text-xl">🎯</span>
          <span className="font-bold text-sm">Misi Pintar</span>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-emerald-100 text-xs hover:text-white">
            Keluar
          </button>
        </form>
      </header>

      <div className="max-w-sm mx-auto px-4 space-y-4 pb-8">
        {/* Avatar & Greeting */}
        <div className="text-white text-center py-2">
          <div className="text-5xl mb-2">{child.avatar ?? '🧒'}</div>
          <h1 className="text-xl font-bold">Halo, {child.name}! 👋</h1>
          <p className="text-emerald-100 text-sm">{child.familySpace.name}</p>
        </div>

        {/* Saldo Card */}
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Saldo Utama</p>
          <p className="text-4xl font-black text-emerald-600">
            Rp {child.balance.toLocaleString('id-ID')}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-600 font-medium">💰 Tabungan</p>
              <p className="text-base font-bold text-blue-700 mt-0.5">
                Rp {child.savingsBalance.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xs text-purple-600 font-medium">🤲 Sedekah</p>
              <p className="text-base font-bold text-purple-700 mt-0.5">
                Rp {child.charityBalance.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Tugas Aktif */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Tugas Aktif</h2>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
              {pendingTasks.length} tugas
            </span>
          </div>
          {pendingTasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-1">🎉</p>
              <p className="text-gray-400 text-sm">Semua tugas selesai!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                      +Rp {task.rewardAmount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg font-medium">
                    Klaim
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
