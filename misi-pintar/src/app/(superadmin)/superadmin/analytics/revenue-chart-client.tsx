"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Props {
  data: { label: string; revenue: number }[];
}

function fmtIDR(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  return `Rp ${value}`;
}

export default function RevenueChartClient({ data }: Props) {
  if (data.every((d) => d.revenue === 0)) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
        Belum ada data revenue untuk ditampilkan.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmtIDR}
          tick={{ fill: "#9CA3AF", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip
          formatter={(v: number) => [`Rp ${v.toLocaleString("id-ID")}`, "Revenue"]}
          contentStyle={{
            background: "#1F2937",
            border: "1px solid #374151",
            borderRadius: 8,
            color: "#F9FAFB",
            fontSize: 12,
          }}
          cursor={{ fill: "#374151" }}
        />
        <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
