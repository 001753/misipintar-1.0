import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SuperAdminDashboard() {
  const [
    totalFamilies,
    totalChildren,
    totalActiveSubs,
    pendingInvoices,
    recentAuditLogs,
    appConfig,
  ] = await Promise.all([
    prisma.familySpace.count(),
    prisma.child.count({ where: { deletedAt: null } }),
    prisma.subscription.count({
      where: { status: { notIn: ["FREE", "EXPIRED", "CANCELLED"] } },
    }),
    prisma.invoice.count({ where: { status: "PENDING" } }),
    prisma.adminAuditLog.findMany({
      include: { admin: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.appConfig.findUnique({ where: { id: "global-config" } }),
  ]);

  const stats = [
    { label: "Total Keluarga", value: totalFamilies, icon: "👨‍👩‍👧", href: "/superadmin/families", color: "bg-blue-600" },
    { label: "Total Anak Aktif", value: totalChildren, icon: "🧒", href: "/superadmin/families", color: "bg-purple-600" },
    { label: "Langganan Aktif", value: totalActiveSubs, icon: "⭐", href: "/superadmin/analytics", color: "bg-emerald-600" },
    { label: "Invoice Tertunda", value: pendingInvoices, icon: "💳", href: "/superadmin/payments", color: "bg-amber-600" },
  ];

  const PHASE_LABELS: Record<string, string> = {
    FULL_FREE: "Full Free (semua fitur gratis)",
    FREEMIUM: "Freemium (starter gratis, premium bayar)",
    PAID_ONLY: "Paid Only (harus berlangganan)",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">SuperAdmin Dashboard</h1>
        <p className="text-gray-400 mt-1">Kontrol penuh platform Misi Pintar</p>
      </div>

      {/* Phase Mode Banner */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Phase Mode Aktif</p>
          <p className="text-white font-bold mt-1">
            {PHASE_LABELS[appConfig?.phaseMode ?? "FULL_FREE"]}
          </p>
        </div>
        <Link
          href="/superadmin/plans"
          className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Ubah Mode →
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-500 transition-colors cursor-pointer">
              <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center text-xl mb-3`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-white">{s.value.toLocaleString("id-ID")}</p>
              <p className="text-sm text-gray-400 mt-1">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/superadmin/plans", label: "Kelola Plan", icon: "💎" },
            { href: "/superadmin/families", label: "Cari Keluarga", icon: "🔍" },
            { href: "/superadmin/analytics", label: "Revenue Analytics", icon: "📈" },
            { href: "/superadmin/audit", label: "Audit Log", icon: "📋" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-xl p-4 flex items-center gap-3 transition-colors"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-sm text-gray-200 font-medium">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Aktivitas Terbaru</h2>
          <Link href="/superadmin/audit" className="text-sm text-emerald-400 hover:text-emerald-300">
            Lihat semua →
          </Link>
        </div>
        {recentAuditLogs.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada aktivitas admin.</p>
        ) : (
          <div className="space-y-2">
            {recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-mono bg-gray-700 text-emerald-400 px-2 py-0.5 rounded">
                    {log.action}
                  </span>
                  <span className="text-sm text-gray-400 ml-3">
                    {log.targetType} · {log.admin.name ?? log.admin.email}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
