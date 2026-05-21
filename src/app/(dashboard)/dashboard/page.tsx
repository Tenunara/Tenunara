"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem("sb-user-role")
    if (role === "umkm") {
      router.push("/dashboard/listings")
    } else {
      router.push("/dashboard/browse")
    }
  }, [router])

  return null
}
