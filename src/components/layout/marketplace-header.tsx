"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Bell, ShoppingCart, Menu, Search, LogOut, LayoutDashboard, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Profile } from "@/lib/types"

const LOGO_SRC = "/images/logo.png"

interface MarketplaceHeaderProps {
  user: Profile | null
  onLogout: () => Promise<void>
}

export function MarketplaceHeader({ user, onLogout }: MarketplaceHeaderProps) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/browse?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-6">
        {/* Mobile menu trigger */}
        {user && (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" />
              }
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader className="border-b border-border pb-4">
                <SheetTitle className="flex items-center gap-2 text-left">
                    <Image
                      src={LOGO_SRC}
                      alt="Tenunara"
                      width={140}
                      height={40}
                      className="h-8 w-auto"
                      priority
                    />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-tenunara-teal hover:bg-tenunara-mint hover:text-tenunara-charcoal"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link
                  href="/dashboard/orders"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-tenunara-teal hover:bg-tenunara-mint hover:text-tenunara-charcoal"
                >
                  <ShoppingCart className="h-4 w-4" /> Pesanan Saya
                </Link>
                <Link
                  href="/dashboard/browse"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-tenunara-teal hover:bg-tenunara-mint hover:text-tenunara-charcoal"
                >
                  <Search className="h-4 w-4" /> Cari Produk
                </Link>
              </nav>
              <div className="mt-auto border-t border-border p-4">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 rounded-xl border-border text-tenunara-charcoal"
                  onClick={async () => { setMobileOpen(false); await onLogout() }}
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="-ml-1 flex shrink-0 items-center gap-2 sm:-ml-2">
          <Image
            src={LOGO_SRC}
            alt="Tenunara"
            width={150}
            height={44}
            className="h-8 w-auto md:h-9"
            priority
          />
        </Link>

        {/* Nav links — pengrajin */}
        {user && (
          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/dashboard/browse"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-tenunara-teal transition-colors hover:bg-tenunara-mint/50 hover:text-tenunara-charcoal"
            >
              <Sparkles className="h-4 w-4" />
              Pencarian Cerdas
            </Link>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-tenunara-teal transition-colors hover:bg-tenunara-mint/50 hover:text-tenunara-charcoal"
            >
              <ShoppingCart className="h-4 w-4" />
              Pesanan Saya
            </Link>
          </nav>
        )}

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex max-w-xl flex-1 items-center">
          <div className="flex w-full items-center overflow-hidden rounded-xl border-2 border-border bg-tenunara-canvas transition-all focus-within:border-tenunara-terracotta focus-within:shadow-[0_0_0_3px_rgba(156,74,60,0.1)]">
            <select className="hidden h-9 border-r border-border bg-transparent px-3 text-xs font-medium text-tenunara-teal outline-none sm:block">
              <option>Semua</option>
              <option>Denim</option>
              <option>Katun</option>
              <option>Polyester</option>
              <option>Campuran</option>
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari limbah kain, grade, atau UMKM..."
              className="h-9 flex-1 bg-transparent px-3 text-sm text-tenunara-charcoal outline-none placeholder:text-tenunara-teal/40"
            />
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center bg-tenunara-terracotta text-white"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Right icons */}
        {user && (
          <div className="flex items-center gap-1">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-tenunara-teal transition-colors hover:bg-tenunara-mint hover:text-tenunara-charcoal">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-tenunara-terracotta text-[8px] font-bold text-white">3</span>
            </button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-tenunara-teal transition-colors hover:bg-tenunara-mint hover:text-tenunara-charcoal">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-tenunara-terracotta text-[8px] font-bold text-white">2</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="ml-1 h-9 w-9 rounded-full p-0" />
                }
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-tenunara-terracotta text-xs font-semibold text-white">
                    {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                <div className="border-b border-border px-3 py-2">
                  <p className="text-sm font-semibold text-tenunara-charcoal">{user.name}</p>
                  {user.company && <p className="text-xs text-tenunara-teal">{user.company}</p>}
                </div>
                <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer rounded-xl">
                  <LayoutDashboard className="mr-2 h-4 w-4 text-tenunara-teal" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer rounded-xl text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Not logged in */}
        {!user && (
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-tenunara-teal hover:bg-tenunara-mint/50">Masuk</Link>
            <Link href="/register" className="rounded-xl bg-tenunara-terracotta px-4 py-2 text-sm font-semibold text-white hover:bg-tenunara-terracotta/90">Daftar</Link>
          </div>
        )}
      </div>
    </header>
  )
}
