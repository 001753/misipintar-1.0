import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AvatarUploadButton from '@/components/avatar-upload-button'

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
  const completedCount = tasks.filter((t) => t.status === 'APPROVED').length

  return (
    <div className="space-y-4 pt-2 pb-4">
      {/* ── Avatar & Greeting ── */}
      <div className="animate-fade-up text-white text-center pt-2 pb-4">
        <div className="flex justify-center mb-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-xl border-2 border-white/30">
              {child.avatar ?? '🧒'}
            </div>
            <AvatarUploadButton currentAvatar={child.avatar} size="xl" />
            {completedCount > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                {completedCount}
              </div>
            )}
          </div>
        </div>
        <h1 className="text-xl font-black">Halo, {child.name}! 🌟</h1>
        <p className="text-emerald-100 text-sm mt-0.5">{child.familySpace.name}</p>
      </div>

      {/* ── Saldo Card ── */}
      <div className="animate-fade-up delay-100 bg-white rounded-3xl p-5 shadow-2xl shadow-black/10">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold text-center mb-1">Saldo Utama</p>
        <p className="text-5xl font-black text-emerald-600 text-center leading-tight">
          Rp {child.balance.toLocaleString('id-ID')}
        </p>
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-3 border border-blue-100">
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wide">💰 Tabungan</p>
            <p className="text-base font-black text-blue-700 mt-1">
              Rp {child.savingsBalance.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-3 border border-purple-100">
            <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wide">🤲 Sedekah</p>
            <p className="text-base font-black text-purple-700 mt-1">
              Rp {child.charityBalance.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* ── XP / Progress bar ── */}
      <div className="animate-fade-up delay-150 bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-sm font-bold">⚡ Misi Selesai</span>
          <span className="text-white text-sm font-black">{completedCount} misi</span>
        </div>
        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-300 to-amber-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min((completedCount / 10) * 100, 100)}%` }}
          />
        </div>
        <p className="text-emerald-100 text-[10px] mt-1.5 text-right">{10 - Math.min(completedCount, 10)} lagi untuk naik level!</p>
      </div>

      {/* ── Active Tasks ── */}
      <div className="animate-fade-up delay-200 bg-white rounded-3xl p-4 shadow-xl shadow-black/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-gray-900 text-base">🎯 Misi Aktif</h2>
          <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
            {pendingTasks.length} misi
          </span>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-gray-500 text-sm font-medium">Semua misi selesai!</p>
            <p className="text-gray-400 text-xs mt-0.5">Tunggu misi baru dari orang tua</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.slice(0, 4).map((task, i) => (
              <Link
                key={task.id}
                href={`/child/tasks/${task.id}/claim`}
                className={`animate-fade-up delay-${(i + 1) * 100} card-hover flex items-center justify-between p-3.5 bg-gradient-to-r from-gray-50 to-emerald-50/50 hover:from-emerald-50 hover:to-emerald-100/50 rounded-2xl border border-gray-100 transition-all`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-emerald-600 font-black mt-0.5">
                    +Rp {task.rewardAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                <span className="btn-press ml-3 shrink-0 text-xs bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold shadow-sm">
                  Klaim →
                </span>
              </Link>
            ))}
          </div>
        )}

        {pendingTasks.length > 0 && (
          <Link
            href="/child/tasks"
            className="block text-center text-xs text-emerald-600 hover:text-emerald-700 font-bold mt-3 py-2 bg-emerald-50 rounded-2xl transition-colors"
          >
            Lihat semua {pendingTasks.length} misi →
          </Link>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="animate-fade-up delay-300 grid grid-cols-2 gap-3">
        <Link
          href="/child/transfer"
          className="btn-press bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 shadow-lg border border-white/50 transition-all"
        >
          <span className="text-2xl">💸</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">Transfer</p>
            <p className="text-[10px] text-gray-500">Kirim saldo</p>
          </div>
        </Link>
        <Link
          href="/child/history"
          className="btn-press bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 shadow-lg border border-white/50 transition-all"
        >
          <span className="text-2xl">📜</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">Riwayat</p>
            <p className="text-[10px] text-gray-500">Transaksi</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
