"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // TODO: Read actual user role from Profile context/store
    // For now we redirect to a default page
    // router.push("/dashboard/listings")
  }, [router])

  return null
}
