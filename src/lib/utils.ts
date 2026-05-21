import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format as Indonesian Rupiah: Rp 10.000
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format date: 19 Mei 2026
export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoString))
}

// Relative time: "2 jam lalu", "3 hari lalu"
export function formatRelativeTime(isoString: string): string {
  const now = new Date()
  const date = new Date(isoString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins} menit lalu`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} jam lalu`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} hari lalu`
}

// Grade A/B/C → Tailwind color classes
export function getGradeColor(grade: string): string {
  if (grade === "A") return "text-grade-success"
  if (grade === "B") return "text-grade-warning"
  return "text-grade-info"
}

export function getGradeBg(grade: string): string {
  if (grade === "A") return "bg-grade-success/10"
  if (grade === "B") return "bg-grade-warning/10"
  return "bg-grade-info/10"
}

// Transaction status → Indonesian label
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Menunggu",
    escrow_held: "Dana Ditahan",
    shipped: "Dikirim",
    delivered: "Diterima",
    completed: "Selesai",
    disputed: "Sengketa",
    refunded: "Dikembalikan",
  }
  return labels[status] || status
}

// Transaction status → color class
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "text-muted-foreground",
    escrow_held: "text-blue-600",
    shipped: "text-grade-warning",
    delivered: "text-purple-600",
    completed: "text-grade-success",
    disputed: "text-destructive",
    refunded: "text-muted-foreground",
  }
  return colors[status] || "text-muted-foreground"
}

// ESG calculations
export function calculateCO2(kg: number): number {
  return kg * 6.8
}

export function calculateTrees(kg: number): number {
  return Math.round((kg * 6.8) / 60)
}

// Format number with thousand separators
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n)
}
