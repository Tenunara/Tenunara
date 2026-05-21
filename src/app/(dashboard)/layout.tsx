"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { LoadingSpinner } from "@/components/shared"
import type { Profile } from "@/lib/types"

// TODO: Replace with real auth check from Supabase session
async function fetchProfile(): Promise<Profile | null> {
  try {
    const res = await fetch("/data/temp_data_profile_seller.json")
    if (!res.ok) return null
    const json = await res.json()
    return json as Profile
  } catch {
    return null
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with real Supabase session check + profile fetch
    fetchProfile()
      .then((profile) => {
        if (!profile) {
          router.push("/login")
          return
        }
        setUser(profile)
        setLoading(false)
      })
      .catch(() => {
        router.push("/login")
      })
  }, [router])

  const handleLogout = async () => {
    // TODO: Implement actual Supabase signOut
    // await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tenunara-canvas">
        <LoadingSpinner size="lg" text="Memuat..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-tenunara-canvas">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="flex flex-1">
        <Sidebar user={user} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
