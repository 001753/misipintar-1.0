import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import WeeklyActivityChart from './weekly-chart'
import SpendingAnalyticsChart, { type WeekData } from './spending-chart'

export default async function ParentDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== 'PARENT') redirect('/login')

  const familySpaceId = session.user.familySpaceId!

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - dayOfWeek)
  weekStart.setHours(0, 0, 0, 0)

  // 8-week window for spending analytics
  const eightWeeksAgo = new Date(now)
  eightWeeksAgo.setDate(now.getDate() - 55) // 8 weeks back from start of current week
  eightWeeksAgo.setHours(0, 0, 0, 0)

  const [
    familySpace,
    activeChildren,
    pendingTasks,
    subscription,
    monthlyRewards,
    weeklyTasks,
    monthlyLeaderboard,
    lastMonthRewards,
    spendingTasks,
  ] = await Promise.all([
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
      where: { familySpaceId, status: 'APPROVED', approvedAt: { gte: monthStart } },
      _sum: { rewardAmount: true },
      _count: true,
    }),
    prisma.task.findMany({
      where: { familySpaceId, status: 'APPROVED', approvedAt: { gte: weekStart } },
      select: { childId: true, approvedAt: true },
      orderBy: { approvedAt: 'asc' },
    }),
    prisma.task.groupBy({
      by: ['childId'],
      where: { familySpaceId, status: 'APPROVED', approvedAt: { gte: monthStart } },
      _count: { _all: true },
      _sum: { rewardAmount: true },
    }),
    // last month total for trend comparison
    prisma.task.aggregate({
      where: {
        familySpaceId,
        status: 'APPROVED',
        approvedAt: { gte: lastMonthStart, lt: monthStart },
      },
      _sum: { rewardAmount: true },
    }),
    // 8 weeks of task data for spending chart
    prisma.task.findMany({
      where: {
        familySpaceId,
        status: 'APPROVED',
        approvedAt: { gte: eightWeeksAgo },
      },
      select: { childId: true, approvedAt: true, rewardAmount: true },
      orderBy: { approvedAt: 'asc' },
    }),
  ])

  const totalBalance = activeChildren.reduce((sum, c) => sum + c.balance, 0)
  const firstName = session.user.name?.split(' ')[0]
  const monthlyTotal = monthlyRewards._sum.rewardAmount ?? 0
  const monthlyTaskCount = monthlyRewards._count
  const lastMonthTotal = lastMonthRewards._sum.rewardAmount ?? 0
  const monthName = now.toLocaleDateString('id-ID', { month: 'long' })

  // ── Weekly activity chart data ──
  const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const childNames = activeChildren.map((c) => c.name)

  type DayData = { day: string; [name: string]: string | number }
  const chartData: DayData[] = DAY_LABELS.map((label) => {
    const entry: DayData = { day: label }
    for (const name of childNames) entry[name] = 0
    return entry
  })
  for (const task of weeklyTasks) {
    const taskDay = new Date(task.approvedAt!).getDay()
    const idx = taskDay === 0 ? 6 : taskDay - 1
    const childName = activeChildren.find((c) => c.id === task.childId)?.name
    if (childName && chartData[idx]) {
      chartData[idx][childName] = ((chartData[idx][childName] as number) || 0) + 1
    }
  }
  const visibleChartData = chartData.slice(0, dayOfWeek + 1)

  // ── Spending analytics: 8 weekly buckets ──
  // Find the Monday of eightWeeksAgo week
  const anchorMonday = new Date(eightWeeksAgo)
  const anchorDay = anchorMonday.getDay() === 0 ? 6 : anchorMonday.getDay() - 1
  anchorMonday.setDate(anchorMonday.getDate() - anchorDay)
  anchorMonday.setHours(0, 0, 0, 0)

  const weekBuckets: WeekData[] = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(anchorMonday)
    d.setDate(anchorMonday.getDate() + i * 7)
    const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    const entry: WeekData = { week: label, total: 0 }
    for (const name of childNames) entry[name] = 0
    return entry
  })

  for (const task of spendingTasks) {
    const approvedAt = new Date(task.approvedAt!)
    const msFromAnchor = approvedAt.getTime() - anchorMonday.getTime()
    const weekIdx = Math.floor(msFromAnchor / (7 * 24 * 60 * 60 * 1000))
    if (weekIdx < 0 || weekIdx >= 8) continue
    const childName = activeChildren.find((c) => c.id === task.childId)?.name
    if (childName) {
      weekBuckets[weekIdx][childName] =
        ((weekBuckets[weekIdx][childName] as number) || 0) + task.rewardAmount
      weekBuckets[weekIdx].total += task.rewardAmount
    }
  }

  // ── Leaderboard ──
  const leaderboard = activeChildren
    .map((child) => {
      const stats = monthlyLeaderboard.find((r) => r.childId === child.id)
      return {
        ...child,
        taskCount: stats?._count._all ?? 0,
        rewardEarned: stats?._sum.rewardAmount ?? 0,
      }
    })
    .sort((a, b) => b.taskCount - a.taskCount || b.rewardEarned - a.rewardEarned)

  const maxTasks = leaderboard[0]?.taskCount ?? 0
  const hasLeaderboardData = maxTasks > 0
  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="animate-fade-up">
        <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">Selamat datang kembali 👋</p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-50 mt-0.5">{firstName}</h1>
        <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">{familySpace?.name}</p>
      </div>

      {/* ── Family Summary Widget ── */}
      <div className="animate-fade-up delay-75">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 rounded-3xl p-5 shadow-xl shadow-emerald-100 dark:shadow-emerald-900/30">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/5 rounded-full" />
          <div className="absolute top-4 right-20 w-10 h-10 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mb-1">🏠 Kode Keluarga</p>
                <p className="text-3xl font-black tracking-[0.3em] text-white font-mono">{familySpace?.spaceCode}</p>
              </div>
              <p className="text-emerald-200 text-[10px] leading-snug max-w-[110px] text-right">Bagikan ke anak untuk masuk ke aplikasi</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SummaryTile icon="👧" value={String(activeChildren.length)} label="Anak Aktif" href="/dashboard/children" />
              <SummaryTile icon="⏳" value={String(pendingTasks.length)} label="Perlu Review" href="/dashboard/tasks/pending" alert={pendingTasks.length > 0} />
              <SummaryTile icon="🏆" value={monthlyTotal >= 1000 ? `${Math.round(monthlyTotal / 1000)}k` : String(monthlyTotal)} label={`Reward ${monthName}`} sub={`${monthlyTaskCount} tugas`} href="/dashboard/ledger" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Spending Analytics Chart ── */}
      {activeChildren.length > 0 && (
        <div className="animate-fade-up delay-100 bg-gray-900 dark:bg-gray-900 rounded-3xl border border-gray-800 shadow-lg p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-base font-bold text-white">💸 Analitik Reward</h2>
              <p className="text-xs text-gray-500 mt-0.5">Distribusi reward per minggu</p>
            </div>
            <Link
              href="/dashboard/ledger"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-950/50 border border-emerald-800 px-3 py-1.5 rounded-xl transition-colors"
            >
              Ledger →
            </Link>
          </div>
          <SpendingAnalyticsChart
            data={weekBuckets}
            childNames={childNames}
            currentMonthTotal={monthlyTotal}
            lastMonthTotal={lastMonthTotal}
          />
        </div>
      )}

      {/* ── Leaderboard ── */}
      {activeChildren.length > 0 && (
        <div className="animate-fade-up delay-150">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-50">🏅 Papan Peringkat</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Misi selesai bulan {monthName}</p>
            </div>
            {hasLeaderboardData && (
              <span className="text-xs bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 font-semibold px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-900">
                {monthlyTaskCount} total tugas
              </span>
            )}
          </div>

          {!hasLeaderboardData ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center transition-colors duration-200">
              <p className="text-4xl mb-2">🚀</p>
              <p className="text-gray-700 dark:text-gray-300 font-bold text-sm">Belum ada misi selesai bulan ini</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Peringkat akan muncul saat anak menyelesaikan misi pertama</p>
              <Link href="/dashboard/tasks" className="inline-block mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                Buat misi baru →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard[0] && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 p-px shadow-lg shadow-amber-100 dark:shadow-amber-900/30">
                  <div className="relative bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/80 dark:to-yellow-950/80 rounded-[calc(1.5rem-1px)] p-4">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/40 dark:bg-amber-500/10 rounded-full -translate-y-8 translate-x-8" />
                    <div className="relative flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/50 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center text-3xl overflow-hidden shadow-md">
                          {leaderboard[0].avatar?.startsWith('data:image/') ? (
                            <img src={leaderboard[0].avatar} alt={leaderboard[0].name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{leaderboard[0].avatar ?? '🧒'}</span>
                          )}
                        </div>
                        <span className="absolute -top-2 -right-2 text-xl leading-none">👑</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-base font-black text-amber-900 dark:text-amber-200">{leaderboard[0].name}</span>
                        <p className="text-xs text-amber-700 dark:text-amber-400">@{leaderboard[0].username}</p>
                        <div className="mt-2 h-1.5 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-2xl font-black text-amber-800 dark:text-amber-300 leading-none">{leaderboard[0].taskCount}</p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold">misi selesai</p>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1">
                          +{leaderboard[0].rewardEarned >= 1000 ? `${(leaderboard[0].rewardEarned / 1000).toFixed(0)}k` : leaderboard[0].rewardEarned}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {leaderboard.length > 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {leaderboard.slice(1, 3).map((child, i) => {
                    const rank = i + 2
                    const pct = maxTasks > 0 ? Math.round((child.taskCount / maxTasks) * 100) : 0
                    const styles = rank === 2
                      ? { bg: 'bg-slate-50 dark:bg-slate-900/60', border: 'border-slate-200 dark:border-slate-700', bar: 'bg-slate-400', text: 'text-slate-700 dark:text-slate-300', sub: 'text-slate-500 dark:text-slate-400' }
                      : { bg: 'bg-orange-50 dark:bg-orange-950/50', border: 'border-orange-200 dark:border-orange-800', bar: 'bg-orange-400', text: 'text-orange-700 dark:text-orange-300', sub: 'text-orange-500 dark:text-orange-400' }
                    return (
                      <div key={child.id} className={`${styles.bg} border ${styles.border} rounded-2xl p-3.5 transition-colors duration-200`}>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-11 h-11 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                              {child.avatar?.startsWith('data:image/') ? (
                                <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{child.avatar ?? '🧒'}</span>
                              )}
                            </div>
                            <span className="absolute -top-2 -right-2 text-base leading-none">{MEDALS[rank - 1]}</span>
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold text-sm ${styles.text} truncate`}>{child.name}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">@{child.username}</p>
                          </div>
                        </div>
                        <div className="flex items-end justify-between mb-1.5">
                          <p className={`text-xl font-black ${styles.text}`}>{child.taskCount}</p>
                          <p className={`text-[10px] font-semibold ${styles.sub}`}>
                            +{child.rewardEarned >= 1000 ? `${(child.rewardEarned / 1000).toFixed(0)}k` : child.rewardEarned}
                          </p>
                        </div>
                        <div className="h-1.5 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full ${styles.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">misi selesai</p>
                      </div>
                    )
                  })}
                </div>
              )}

              {leaderboard.length > 3 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800 overflow-hidden transition-colors duration-200">
                  {leaderboard.slice(3).map((child, i) => {
                    const rank = i + 4
                    const pct = maxTasks > 0 ? Math.round((child.taskCount / maxTasks) * 100) : 0
                    return (
                      <div key={child.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="w-6 text-center text-sm font-black text-gray-300 dark:text-gray-600">{rank}</span>
                        <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700">
                          {child.avatar?.startsWith('data:image/') ? (
                            <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{child.avatar ?? '🧒'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{child.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-gray-700 dark:text-gray-300 text-sm">{child.taskCount}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">misi</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Weekly Activity Chart ── */}
      {activeChildren.length > 0 && (
        <div className="animate-fade-up delay-200 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-black/20 p-5 transition-colors duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-50">📈 Aktivitas Minggu Ini</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Tugas selesai per hari · Senin s/d hari ini</p>
            </div>
            {childNames.length > 0 && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                {childNames.slice(0, 3).map((name, i) => (
                  <span key={name} className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: COLORS[i % COLORS.length] }}>
                    {name.split(' ')[0]}
                  </span>
                ))}
              </div>
            )}
          </div>
          <WeeklyActivityChart data={visibleChartData} childNames={childNames} />
        </div>
      )}

      {/* ── Secondary Stats ── */}
      <div className="animate-fade-up delay-250 grid grid-cols-2 gap-3">
        <StatCard label="Total Saldo Anak" value={`Rp ${(totalBalance / 1000).toFixed(0)}K`} icon="💰" color="emerald" />
        <StatCard label="Paket Aktif" value={subscription?.plan.name ?? 'Starter'} icon="⭐" color="purple" />
      </div>

      {/* ── Pending Tasks ── */}
      {pendingTasks.length > 0 && (
        <div className="animate-fade-up delay-300">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-50">⏳ Menunggu Review</h2>
            <span className="text-xs bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full font-bold">
              {pendingTasks.length} tugas
            </span>
          </div>
          <div className="space-y-2">
            {pendingTasks.map((task, i) => (
              <Link key={task.id} href="/dashboard/tasks/pending" className={`card-hover animate-fade-up bg-white dark:bg-gray-900 rounded-2xl border border-amber-100 dark:border-amber-900/50 p-4 flex items-center justify-between shadow-sm dark:shadow-black/20 delay-${(i + 1) * 100} transition-colors duration-200`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{task.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {task.child.name} · <span className="text-emerald-600 dark:text-emerald-400 font-bold">Rp {task.rewardAmount.toLocaleString('id-ID')}</span>
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

      {/* ── Children Grid ── */}
      <div className="animate-fade-up delay-350">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-50">Daftar Anak</h2>
          <Link href="/dashboard/children" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl transition-colors">
            Kelola →
          </Link>
        </div>
        {activeChildren.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center transition-colors duration-200">
            <p className="text-4xl mb-3">👧</p>
            <p className="text-gray-700 dark:text-gray-300 font-bold">Belum ada anak terdaftar</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Tambahkan akun anak untuk mulai</p>
            <Link href="/dashboard/children" className="btn-press inline-block mt-4 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold rounded-2xl shadow-md shadow-emerald-100 dark:shadow-emerald-900/20 transition-all">
              + Tambah Anak
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {activeChildren.map((child, i) => (
              <Link key={child.id} href={`/dashboard/history/${child.id}`} className={`card-hover animate-fade-up bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm dark:shadow-black/20 delay-${(i + 1) * 100} transition-colors duration-200`}>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/60 dark:to-teal-950/60 flex items-center justify-center text-2xl shadow-sm overflow-hidden">
                    {child.avatar?.startsWith('data:image/') ? (
                      <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{child.avatar ?? '🧒'}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">{child.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">@{child.username}</p>
                  </div>
                  <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-2">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Saldo</p>
                    <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">Rp {child.balance.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="animate-fade-up delay-400">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-50 mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/dashboard/tasks',   icon: '➕', label: 'Buat Tugas',  color: 'from-emerald-500 to-emerald-600' },
            { href: '/dashboard/ledger',  icon: '📊', label: 'Lihat Saldo', color: 'from-blue-500 to-blue-600' },
            { href: '/dashboard/billing', icon: '💳', label: 'Billing',     color: 'from-purple-500 to-purple-600' },
          ].map(({ href, icon, label, color }) => (
            <Link key={href} href={href} className={`btn-press flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${color} text-white shadow-md transition-all`}>
              <span className="text-2xl">{icon}</span>
              <span className="text-[10px] font-bold text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899']

function SummaryTile({ icon, value, label, sub, href, alert = false }: {
  icon: string; value: string; label: string; sub?: string; href: string; alert?: boolean
}) {
  return (
    <Link href={href} className={`flex flex-col items-center text-center gap-1 px-2 py-3 rounded-2xl transition-all active:scale-95 ${alert ? 'bg-amber-400/30 ring-2 ring-amber-300/60' : 'bg-white/15 hover:bg-white/25'}`}>
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-xl font-black text-white leading-none">{value}</span>
      <span className="text-[10px] text-emerald-100 font-medium leading-tight">{label}</span>
      {sub && <span className="text-[9px] text-emerald-200/70">{sub}</span>}
      {alert && value !== '0' && <span className="text-[9px] font-bold text-amber-200 bg-amber-500/40 px-1.5 py-0.5 rounded-full">Tap →</span>}
    </Link>
  )
}

function StatCard({ label, value, icon, color }: {
  label: string; value: string; icon: string; color: string
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    blue:    'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
    amber:   'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    purple:  'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400',
  }
  return (
    <div className={`card-hover rounded-2xl p-4 shadow-sm border border-transparent transition-colors duration-200 ${colors[color] ?? 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-lg font-black leading-tight">{value}</p>
      <p className="text-[11px] font-medium mt-0.5 opacity-70">{label}</p>
    </div>
  )
}
