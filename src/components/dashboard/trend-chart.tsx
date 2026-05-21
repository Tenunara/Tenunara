"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { DashboardTrend } from "@/lib/types"

const COLORS = {
  generated: "#9CAFAA",
  diverted: "#D4A68A",
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-white p-3 shadow-lg ring-1 ring-foreground/10">
      <p className="mb-1 text-xs font-semibold text-tenunara-charcoal">
        {label}
      </p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString("id-ID")} kg
        </p>
      ))}
    </div>
  )
}

interface TrendChartProps {
  data: DashboardTrend[]
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white text-sm text-tenunara-teal/60">
        Belum ada data tren bulanan
      </div>
    )
  }

  const chartData = data.map((d) => ({
    month: d.month,
    "Limbah Dihasilkan": d.waste_generated_kg,
    "Limbah Dialihkan": d.waste_diverted_kg,
  }))

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-foreground/5">
      <h3 className="mb-1 text-sm font-semibold text-tenunara-charcoal">
        Tren Bulanan
      </h3>
      <p className="mb-4 text-xs text-tenunara-teal/60">
        Perbandingan limbah dihasilkan vs dialihkan per bulan
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#6B8F8A" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B8F8A" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}kg`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar
            dataKey="Limbah Dihasilkan"
            fill={COLORS.generated}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            dataKey="Limbah Dialihkan"
            fill={COLORS.diverted}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
