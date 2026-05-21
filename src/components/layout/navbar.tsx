"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Leaf,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { Sidebar } from "@/components/layout/sidebar";

const LOGO_SRC = "/images/logo.png";

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavbarProps {
  user: Profile | null;
  onLogout: () => Promise<void>;
}

const sellerLinks: NavLink[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Listing Saya",
    href: "/dashboard/listings",
    icon: <Package className="h-4 w-4" />,
  },
  {
    label: "Pesanan Masuk",
    href: "/dashboard/orders",
    icon: <ShoppingCart className="h-4 w-4" />,
  },
];

const buyerLinks: NavLink[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Pencarian Cerdas",
    href: "/dashboard/browse",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    label: "Pesanan Saya",
    href: "/dashboard/orders",
    icon: <ShoppingCart className="h-4 w-4" />,
  },
];

export function Navbar({ user, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isSeller = user?.role === "seller" || user?.role === "umkm";
  const navLinks = isSeller ? sellerLinks : buyerLinks;

  const handleMobileLogout = async () => {
    setMobileOpen(false);
    await onLogout();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full bg-white transition-shadow duration-200",
        scrolled && "shadow-sm",
      )}
    >
      <div className="mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Left: Logo + Mobile hamburger */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger — only show when logged in */}
          {user && (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 lg:hidden"
                  />
                }
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Buka menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <Sidebar mobile user={user} onLogout={handleMobileLogout} />
              </SheetContent>
            </Sheet>
          )}

          {/* Logo */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2"
          >
            <Image
              src={LOGO_SRC}
              alt="Tenunara"
              width={150}
              height={44}
              className="h-8 w-auto md:h-9"
              priority
            />
          </Link>
        </div>

        {/* Center: Desktop nav links (logged in only) */}
        {user && (
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200",
                  isActive(link.href)
                    ? "bg-tenunara-mint text-tenunara-charcoal"
                    : "text-tenunara-teal hover:bg-tenunara-mint/50 hover:text-tenunara-charcoal",
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right: Auth buttons or User menu */}
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-tenunara-teal transition-colors duration-200 hover:bg-tenunara-mint/50"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-tenunara-terracotta px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-tenunara-terracotta/90"
              >
                Daftar
              </Link>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-tenunara-mint/50"
                  />
                }
              >
                <Avatar className="h-8 w-8">
                  {/* TODO: Replace initials with actual user avatar image once upload feature is ready */}
                  <AvatarFallback className="bg-tenunara-terracotta text-xs font-semibold text-white">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-tenunara-charcoal md:inline">
                  {user.name}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-tenunara-teal md:inline" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                <div className="border-b border-border px-3 py-2">
                  <p className="text-sm font-semibold text-tenunara-charcoal">
                    {user.name}
                  </p>
                  {user.company && (
                    <p className="text-xs text-tenunara-teal">{user.company}</p>
                  )}
                </div>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard")}
                  className="cursor-pointer rounded-xl"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4 text-tenunara-teal" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="cursor-pointer rounded-xl text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
