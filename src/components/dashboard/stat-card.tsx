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
    <div className="flex flex-col gap-3 rounded-2xl border border-[#E5DDD5] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-tenunara-teal">{label}</span>
        <div className="rounded-xl bg-[#E7F2F280] p-2.5 text-tenunara-terracotta">
          {icon}
        </div>
      </div>
      <div>
        <span className="text-2xl font-bold text-tenunara-charcoal">
          {value}
        </span>
        {sublabel && (
          <span className="ml-1.5 text-xs text-[#4F6263B3]">{sublabel}</span>
        )}
      </div>
      {trend && trendLabel && (
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" && "text-[#2E7D32]",
              trend === "down" && "text-[#C62828]",
              trend === "neutral" && "text-[#4F626399]",
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
