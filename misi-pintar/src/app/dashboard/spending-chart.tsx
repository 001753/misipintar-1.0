'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export type WeekData = {
  week: string
  total: number
  [childName: string]: string | number
}

type Props = {
  data: WeekData[]
  childNames: string[]
  currentMonthTotal: number
  lastMonthTotal: number
}

const CHILD_COLORS = [
  { stroke: '#10b981', fill: '#10b981' },
  { stroke: '#3b82f6', fill: '#3b82f6' },
  { stroke: '#8b5cf6', fill: '#8b5cf6' },
  { stroke: '#f59e0b', fill: '#f59e0b' },
  { stroke: '#ec4899', fill: '#ec4899' },
]

function formatRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${n.toLocaleString('id-ID')}`
}

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
    <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl px-4 py-3 text-sm min-w-[160px]">
      <p className="font-bold text-gray-300 text-xs mb-2">{label}</p>
      {payload
        .filter((p) => p.value > 0)
        .map((p) => (
          <div key={p.name} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-gray-400 text-xs truncate">{p.name}</span>
            <span className="font-bold text-white ml-auto pl-3 text-xs">{formatRp(p.value)}</span>
          </div>
        ))}
      {payload.length > 1 && total > 0 && (
        <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between items-center">
          <span className="text-gray-500 text-xs">Total</span>
          <span className="font-black text-emerald-400 text-xs">{formatRp(total)}</span>
        </div>
      )}
    </div>
  )
}

export default function SpendingAnalyticsChart({
  data,
  childNames,
  currentMonthTotal,
  lastMonthTotal,
}: Props) {
  const hasData = data.some((d) => d.total > 0)

  const trend =
    lastMonthTotal === 0
      ? null
      : ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100

  const TrendIcon =
    trend === null ? Minus : trend > 0 ? TrendingUp : TrendingDown
  const trendColor =
    trend === null
      ? 'text-gray-400'
      : trend > 0
      ? 'text-emerald-400'
      : 'text-red-400'
  const trendBg =
    trend === null
      ? 'bg-gray-800'
      : trend > 0
      ? 'bg-emerald-950/60'
      : 'bg-red-950/50'

  return (
    <div>
      {/* Summary header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">
            Reward Dikucurkan · Bulan Ini
          </p>
          <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">
            {formatRp(currentMonthTotal)}
          </p>
          {lastMonthTotal > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              vs bulan lalu {formatRp(lastMonthTotal)}
            </p>
          )}
        </div>
        {trend !== null && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${trendBg}`}>
            <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
            <span className={`text-xs font-bold ${trendColor}`}>
              {Math.abs(trend).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Child legend pills */}
      {childNames.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {childNames.map((name, i) => (
            <span
              key={name}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ background: CHILD_COLORS[i % CHILD_COLORS.length].stroke }}
            >
              {name.split(' ')[0]}
            </span>
          ))}
        </div>
      )}

      {/* Chart */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-3xl mb-2">💸</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Belum ada data reward
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Grafik muncul saat misi pertama disetujui
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          >
            <defs>
              {childNames.map((name, i) => {
                const c = CHILD_COLORS[i % CHILD_COLORS.length]
                return (
                  <linearGradient
                    key={name}
                    id={`grad-${i}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={c.fill} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={c.fill} stopOpacity={0.03} />
                  </linearGradient>
                )
              })}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
              opacity={0.4}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
              tick={{ fontSize: 9, fill: '#4b5563' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '4 4' }} />
            {childNames.map((name, i) => {
              const c = CHILD_COLORS[i % CHILD_COLORS.length]
              return (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={c.stroke}
                  strokeWidth={2}
                  fill={`url(#grad-${i})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              )
            })}
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* X-axis label */}
      <p className="text-[10px] text-gray-500 dark:text-gray-600 text-center mt-1">
        8 minggu terakhir · reward disetujui
      </p>
    </div>
  )
}
