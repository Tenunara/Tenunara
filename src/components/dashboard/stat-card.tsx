"use client"

import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  sublabel?: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
  trendLabel?: string
}

export function StatCard({ label, value, sublabel, icon, trend, trendLabel }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-tenunara-teal">{label}</span>
        <div className="rounded-xl bg-tenunara-mint/50 p-2.5 text-tenunara-terracotta">
          {icon}
        </div>
      </div>
      <div>
        <span className="text-2xl font-bold text-tenunara-charcoal">{value}</span>
        {sublabel && (
          <span className="ml-1.5 text-xs text-tenunara-teal/70">{sublabel}</span>
        )}
      </div>
      {trend && trendLabel && (
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-500",
              trend === "neutral" && "text-tenunara-teal/60",
            )}
          >
            {trend === "up" && "↑"}
            {trend === "down" && "↓"}
            {trend === "neutral" && "→"}
            {" "}{trendLabel}
          </span>
        </div>
      )}
    </div>
  )
}
