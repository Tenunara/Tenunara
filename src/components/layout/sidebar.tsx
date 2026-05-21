"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Search,
  ShoppingCart,
  Scale,
  Leaf,
  Plus,
  PackagePlus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface SidebarProps {
  user: Profile
}

const sellerItems: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Listing Saya", href: "/dashboard/listings", icon: <Package className="h-5 w-5" /> },
  {
    label: "Buat Listing",
    href: "/dashboard/listings/new",
    icon: <PackagePlus className="h-5 w-5" />,
  },
  { label: "Pesanan Masuk", href: "/dashboard/orders", icon: <ShoppingCart className="h-5 w-5" /> },
  { label: "Sengketa", href: "/dashboard/disputes", icon: <Scale className="h-5 w-5" /> },
  { label: "ESG", href: "/dashboard/esg", icon: <Leaf className="h-5 w-5" /> },
]

const buyerItems: SidebarItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Cari Material", href: "/dashboard/browse", icon: <Search className="h-5 w-5" /> },
  { label: "Pesanan Saya", href: "/dashboard/orders", icon: <ShoppingCart className="h-5 w-5" /> },
  { label: "Sengketa", href: "/dashboard/disputes", icon: <Scale className="h-5 w-5" /> },
  { label: "ESG", href: "/dashboard/esg", icon: <Leaf className="h-5 w-5" /> },
]

// TODO: Also update this sidebar data if role-based routing changes in the future

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const isSeller = user.role === "seller" || user.role === "umkm"
  const items = isSeller ? sellerItems : buyerItems

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-white lg:flex lg:flex-col">
      {/* Logo area */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold text-tenunara-terracotta">◈</span>
          <span className="text-lg font-bold text-tenunara-charcoal">TENUNARA</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {items.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-tenunara-mint font-semibold text-tenunara-charcoal"
                  : "text-tenunara-teal hover:bg-tenunara-mint/50 hover:text-tenunara-charcoal",
              )}
            >
              <span
                className={cn(
                  "transition-colors duration-200",
                  active ? "text-tenunara-terracotta" : "text-tenunara-teal group-hover:text-tenunara-charcoal",
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: User info */}
      <div className="mt-auto border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-xl bg-tenunara-canvas px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tenunara-terracotta text-xs font-bold text-white">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-tenunara-charcoal">
              {user.name}
            </p>
            <p className="truncate text-xs text-tenunara-teal">
              {user.role === "seller" || user.role === "umkm" ? "UMKM" : "Pengrajin"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
