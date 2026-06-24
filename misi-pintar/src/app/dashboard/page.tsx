import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ParentDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const familySpaceId = session.user.familySpaceId!

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [familySpace, activeChildren, pendingTasks, subscription, monthlyRewards] = await Promise.all([
    prisma.familySpace.findUnique({
      where: { id: familySpaceId },
      select: { name: true, spaceCode: true },
    }),
    prisma.child.findMany({
      where: { familySpaceId, deletedAt: null },
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
    prisma.task.aggregate({
      where: {
        familySpaceId,
        status: 'APPROVED',
        approvedAt: { gte: monthStart },
      },
      _sum: { rewardAmount: true },
      _count: true,
    }),
  ])

  const totalBalance = activeChildren.reduce((sum, c) => sum + c.balance, 0)
  const firstName = session.user.name?.split(' ')[0]
  const monthlyTotal = monthlyRewards._sum.rewardAmount ?? 0
  const monthlyTaskCount = monthlyRewards._count

  const monthName = now.toLocaleDateString('id-ID', { month: 'long' })

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="animate-fade-up">
        <p className="text-gray-400 text-sm font-medium">Selamat datang kembali 👋</p>
        <h1 className="text-2xl font-black text-gray-900 mt-0.5">{firstName}</h1>
        <p className="text-emerald-600 text-sm font-semibold">{familySpace?.name}</p>
      </div>

      {/* ── Family Summary Widget ── */}
      <div className="animate-fade-up delay-75">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 rounded-3xl p-5 shadow-xl shadow-emerald-100">
          {/* decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/5 rounded-full" />
          <div className="absolute top-4 right-20 w-10 h-10 bg-white/10 rounded-full" />

          <div className="relative z-10">
            {/* Family code row */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mb-1">🏠 Kode Keluarga</p>
                <p className="text-3xl font-black tracking-[0.3em] text-white font-mono">
                  {familySpace?.spaceCode}
                </p>
              </div>
              <div className="text-right">
                <p className="text-emerald-200 text-[10px] leading-snug max-w-[110px]">
                  Bagikan ke anak untuk masuk ke aplikasi
                </p>
              </div>
            </div>

            {/* Summary stats row */}
            <div className="grid grid-cols-3 gap-3">
              <SummaryTile
                icon="👧"
                value={String(activeChildren.length)}
                label="Anak Aktif"
                href="/dashboard/children"
              />
              <SummaryTile
                icon="⏳"
                value={String(pendingTasks.length)}
                label="Perlu Review"
                href="/dashboard/tasks/pending"
                alert={pendingTasks.length > 0}
              />
              <SummaryTile
                icon="🏆"
                value={monthlyTotal >= 1000 ? `${Math.round(monthlyTotal / 1000)}k` : String(monthlyTotal)}
                label={`Reward ${monthName}`}
                sub={`${monthlyTaskCount} tugas`}
                href="/dashboard/ledger"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Secondary Stats ── */}
      <div className="animate-fade-up delay-150 grid grid-cols-2 gap-3">
        <StatCard label="Total Saldo Anak" value={`Rp ${(totalBalance / 1000).toFixed(0)}K`} icon="💰" color="emerald" />
        <StatCard label="Paket Aktif" value={subscription?.plan.name ?? 'Starter'} icon="⭐" color="purple" />
      </div>

      {/* ── Pending Tasks ── */}
      {pendingTasks.length > 0 && (
        <div className="animate-fade-up delay-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">⏳ Menunggu Review</h2>
            <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-bold">
              {pendingTasks.length} tugas
            </span>
          </div>
          <div className="space-y-2">
            {pendingTasks.map((task, i) => (
              <Link
                key={task.id}
                href="/dashboard/tasks/pending"
                className={`card-hover animate-fade-up bg-white rounded-2xl border border-amber-100 p-4 flex items-center justify-between shadow-sm delay-${(i + 1) * 100}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {task.child.name} · <span className="text-emerald-600 font-bold">Rp {task.rewardAmount.toLocaleString('id-ID')}</span>
                  </p>
                </div>
                <span className="btn-press ml-3 shrink-0 text-xs bg-gradient-to-r from-amber-500 to-amber-400 text-white px-3 py-1.5 rounded-xl font-bold shadow-sm">
                  Review →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Children ── */}
      <div className="animate-fade-up delay-300">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Daftar Anak</h2>
          <Link href="/dashboard/children" className="text-xs text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors">
            Kelola →
          </Link>
        </div>

        {activeChildren.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-8 text-center">
            <p className="text-4xl mb-3">👧</p>
            <p className="text-gray-700 font-bold">Belum ada anak terdaftar</p>
            <p className="text-gray-400 text-sm mt-1">Tambahkan akun anak untuk mulai</p>
            <Link
              href="/dashboard/children"
              className="btn-press inline-block mt-4 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold rounded-2xl shadow-md shadow-emerald-100 transition-all"
            >
              + Tambah Anak
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {activeChildren.map((child, i) => (
              <Link
                key={child.id}
                href={`/dashboard/history/${child.id}`}
                className={`card-hover animate-fade-up bg-white rounded-2xl border border-gray-100 p-4 shadow-sm delay-${(i + 1) * 100}`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-2xl shadow-sm overflow-hidden">
                    {child.avatar?.startsWith('data:image/') ? (
                      <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{child.avatar ?? '🧒'}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm leading-tight">{child.name}</p>
                    <p className="text-[10px] text-gray-400">@{child.username}</p>
                  </div>
                  <div className="w-full bg-emerald-50 rounded-xl p-2">
                    <p className="text-[10px] text-gray-500 font-medium">Saldo</p>
                    <p className="font-black text-emerald-600 text-sm">
                      Rp {child.balance.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="animate-fade-up delay-400">
        <h2 className="text-base font-bold text-gray-900 mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/dashboard/tasks',   icon: '➕', label: 'Buat Tugas',  color: 'from-emerald-500 to-emerald-600' },
            { href: '/dashboard/ledger',  icon: '📊', label: 'Lihat Saldo', color: 'from-blue-500 to-blue-600' },
            { href: '/dashboard/billing', icon: '💳', label: 'Billing',     color: 'from-purple-500 to-purple-600' },
          ].map(({ href, icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className={`btn-press flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${color} text-white shadow-md transition-all`}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-[10px] font-bold text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function SummaryTile({
  icon,
  value,
  label,
  sub,
  href,
  alert = false,
}: {
  icon: string
  value: string
  label: string
  sub?: string
  href: string
  alert?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center text-center gap-1 px-2 py-3 rounded-2xl transition-all active:scale-95 ${
        alert
          ? 'bg-amber-400/30 ring-2 ring-amber-300/60'
          : 'bg-white/15 hover:bg-white/25'
      }`}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-xl font-black text-white leading-none">{value}</span>
      <span className="text-[10px] text-emerald-100 font-medium leading-tight">{label}</span>
      {sub && <span className="text-[9px] text-emerald-200/70">{sub}</span>}
      {alert && value !== '0' && (
        <span className="text-[9px] font-bold text-amber-200 bg-amber-500/40 px-1.5 py-0.5 rounded-full">Tap →</span>
      )}
    </Link>
  )
}

function StatCard({
  label, value, icon, color, alert = false,
}: {
  label: string; value: string; icon: string; color: string; alert?: boolean
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue:    'bg-blue-50 text-blue-700',
    amber:   'bg-amber-50 text-amber-700',
    purple:  'bg-purple-50 text-purple-700',
  }
  return (
    <div className={`card-hover rounded-2xl p-4 shadow-sm border border-transparent ${colors[color] ?? 'bg-gray-50 text-gray-700'} ${alert ? 'ring-2 ring-amber-300' : ''}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-lg font-black leading-tight">{value}</p>
      <p className="text-[11px] font-medium mt-0.5 opacity-70">{label}</p>
    </div>
  )
}
