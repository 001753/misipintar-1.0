'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type DayData = {
  day: string
  [childName: string]: string | number
}

type Props = {
  data: DayData[]
  childNames: string[]
}

const CHILD_COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
]

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xl px-4 py-3 text-sm">
      <p className="font-bold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}</span>
          <span className="font-bold text-gray-900 ml-auto pl-4">{p.value} tugas</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between">
          <span className="text-gray-400 text-xs">Total</span>
          <span className="font-black text-emerald-600 text-xs">{total} tugas</span>
        </div>
      )}
    </div>
  )
}

export default function WeeklyActivityChart({ data, childNames }: Props) {
  const hasActivity = data.some((d) => childNames.some((n) => (d[n] as number) > 0))

  if (!hasActivity) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-gray-500 text-sm font-medium">Belum ada tugas selesai minggu ini</p>
        <p className="text-gray-400 text-xs mt-1">Data akan muncul saat anak menyelesaikan misi</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        barCategoryGap="30%"
        barGap={2}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: '#d1d5db' }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb', radius: 8 }} />
        {childNames.length > 1 && (
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          />
        )}
        {childNames.map((name, i) => (
          <Bar
            key={name}
            dataKey={name}
            fill={CHILD_COLORS[i % CHILD_COLORS.length]}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
