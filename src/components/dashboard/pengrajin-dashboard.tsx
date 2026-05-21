"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Package, Search } from "lucide-react"
import { ProductCard } from "@/components/dashboard/product-card"
import { EmptyState, ErrorState } from "@/components/shared"

interface DashboardProduct {
  id: string
  images_url: string
  fabric_name: string
  final_grade: string | null
  price_per_kg: number
  total_weight_kg: number
  umkm: {
    store_name: string
    kota: string
  }
}

function ProductSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="aspect-[4/3] w-full animate-pulse bg-tenunara-teal/10" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded-lg bg-tenunara-teal/10" />
            <div className="h-3 w-1/2 animate-pulse rounded-lg bg-tenunara-teal/10" />
            <div className="h-5 w-1/3 animate-pulse rounded-lg bg-tenunara-teal/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PengrajinDashboard() {
  const router = useRouter()
  const [products, setProducts] = useState<DashboardProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/products/dashboard?limit=50")
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat produk")
        return res.json()
      })
      .then((json) => {
        // API returns { status, message, data: [...], meta: {...} }
        setProducts(json.data || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div>
        <PageHeader />
        <ProductSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader />
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div>
        <PageHeader />
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Belum ada produk tersedia"
          description="Semua limbah kain dari UMKM akan tampil di sini"
          actionLabel="Cari dengan AI"
          onAction={() => router.push("/dashboard/browse")}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader productCount={products.length} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={(id) => router.push(`/dashboard/listings/${id}`)}
          />
        ))}
      </div>

      {/* Link to semantic search */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => router.push("/dashboard/browse")}
          className="flex items-center gap-2 rounded-xl border border-border bg-white px-6 py-3 text-sm font-medium text-tenunara-teal transition-colors hover:border-tenunara-terracotta hover:text-tenunara-terracotta"
        >
          <Search className="h-4 w-4" />
          Cari dengan Pencarian Cerdas (NLP)
        </button>
      </div>
    </div>
  )
}

function PageHeader({ productCount }: { productCount?: number }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-tenunara-charcoal">Dashboard</h1>
      <p className="mt-1 text-sm text-tenunara-teal">
        {productCount !== undefined
          ? `${productCount} produk tersedia dari seluruh UMKM`
          : "Jelajahi limbah kain dari seluruh UMKM"}
      </p>
    </div>
  )
}
