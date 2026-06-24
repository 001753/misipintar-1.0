import { getRevenueAnalytics } from "@/actions/admin";
import RevenueChartWrapper from "./revenue-chart-wrapper";

export const dynamic = 'force-dynamic';

function fmt(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default async function AnalyticsPage() {
  const data = await getRevenueAnalytics();

  const PLAN_COLORS: Record<string, string> = {
    STARTER: "bg-gray-500",
    PRO: "bg-emerald-500",
    EDUCATOR: "bg-purple-500",
    SCHOOL: "bg-orange-500",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
        <p className="text-gray-400 mt-1">Semua kalkulasi dilakukan di server</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">MRR</p>
          <p className="text-2xl font-bold text-white mt-2">{fmt(data.mrr)}</p>
          <p className="text-xs text-gray-500 mt-1">Monthly Recurring Revenue</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">ARR</p>
          <p className="text-2xl font-bold text-white mt-2">{fmt(data.arr)}</p>
          <p className="text-xs text-gray-500 mt-1">Annual Run Rate</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Langganan Aktif</p>
          <p className="text-2xl font-bold text-white mt-2">{data.totalActiveSubs}</p>
          <p className="text-xs text-gray-500 mt-1">Semua plan berbayar</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Churn Rate</p>
          <p className={`text-2xl font-bold mt-2 ${data.churnRate > 10 ? "text-red-400" : "text-white"}`}>
            {data.churnRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Dibandingkan bulan lalu</p>
        </div>
      </div>

      {/* Revenue Chart (Client Component karena recharts butuh browser) */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Revenue 12 Bulan Terakhir</h2>
        <RevenueChartWrapper data={data.revenueChart} />
      </div>

      {/* Plan Distribution */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Distribusi per Plan</h2>
        {data.distribution.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada data langganan.</p>
        ) : (
          <div className="space-y-3">
            {data.distribution.map((d) => {
              const pct =
                data.totalActiveSubs > 0
                  ? Math.round((d.count / data.totalActiveSubs) * 100)
                  : 0;
              return (
                <div key={d.planType}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{d.planName}</span>
                    <span className="text-white font-semibold">
                      {d.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${PLAN_COLORS[d.planType] ?? "bg-blue-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
