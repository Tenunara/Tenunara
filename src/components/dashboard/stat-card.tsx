"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}

export function StatCard({
  label,
  value,
  sublabel,
  icon,
  trend,
  trendLabel,
}: StatCardProps) {
  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-tenunara-charcoal/[0.06] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-tenunara-teal">{label}</span>
        <div className="rounded-xl bg-tenunara-mint/50 p-2.5 text-tenunara-terracotta transition-transform group-hover:scale-110">
          {icon}
        </div>
      </div>
      <div>
        <span className="text-2xl font-bold text-tenunara-charcoal">
          {value}
        </span>
        {sublabel && (
          <span className="ml-1.5 text-xs text-tenunara-teal/70">{sublabel}</span>
        )}
      </div>
      {trend && trendLabel && (
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" && "text-grade-success",
              trend === "down" && "text-grade-error",
              trend === "neutral" && "text-tenunara-teal/60",
            )}
          >
            {trend === "up" && "↑"}
            {trend === "down" && "↓"}
            {trend === "neutral" && "→"} {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}
