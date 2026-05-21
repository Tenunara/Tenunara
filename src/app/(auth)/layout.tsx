import Link from "next/link"
import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-tenunara-canvas px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="text-2xl font-bold text-tenunara-terracotta">◈</span>
        <span className="text-xl font-bold text-tenunara-charcoal">TENUNARA</span>
      </Link>
      {children}
    </div>
  )
}
