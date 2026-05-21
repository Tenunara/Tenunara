"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Leaf,
  PackagePlus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  user: Profile;
  onLogout?: () => Promise<void>;
  mobile?: boolean;
}

const sellerItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Listing Saya",
    href: "/dashboard/listings",
    icon: <Package className="h-5 w-5" />,
  },
  {
    label: "Buat Listing",
    href: "/dashboard/listings/new",
    icon: <PackagePlus className="h-5 w-5" />,
  },
  {
    label: "Pesanan Masuk",
    href: "/dashboard/orders",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
];

const buyerItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Pencarian Cerdas",
    href: "/dashboard/browse",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    label: "Pesanan Saya",
    href: "/dashboard/orders",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
];

export function Sidebar({ user, onLogout, mobile = false }: SidebarProps) {
  const pathname = usePathname();
  const isSeller = user.role === "seller" || user.role === "umkm";
  const items = isSeller ? sellerItems : buyerItems;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const logo = (
    <Link href="/dashboard" className="flex items-center gap-2">
      <span className="text-xl font-bold text-tenunara-terracotta">◈</span>
      <span className="text-lg font-bold text-tenunara-charcoal">TENUNARA</span>
    </Link>
  );

  const navigation = (
    <nav className="flex flex-col gap-1 p-4">
      {items.map((item) => {
        const active = isActive(item.href);
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
                active
                  ? "text-tenunara-terracotta"
                  : "text-tenunara-teal group-hover:text-tenunara-charcoal",
              )}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
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
            {user.role === "seller" || user.role === "umkm"
              ? "UMKM"
              : "Pengrajin"}
          </p>
        </div>
      </div>

      {onLogout && (
        <Button
          variant="outline"
          className="mt-4 w-full justify-start gap-2 rounded-xl border-border text-tenunara-charcoal hover:bg-tenunara-mint/50"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      )}
    </div>
  );

  if (mobile) {
    return (
      <div className="flex h-full min-h-full flex-col bg-white">
        <div className="flex h-16 items-center border-b border-border px-6">
          {logo}
        </div>
        {navigation}
        {footer}
      </div>
    );
  }

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-white lg:flex lg:flex-col">
      {/* Logo area */}
      <div className="flex h-16 items-center border-b border-border px-6">
        {logo}
      </div>

      {/* Navigation */}
      {navigation}

      {/* Bottom: User info */}
      {footer}
    </aside>
  );
}
