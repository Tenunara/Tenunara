"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Package, Search, ShoppingBag } from "lucide-react"
import { HeroBanner } from "@/components/dashboard/hero-banner"
import { CategoryPills } from "@/components/dashboard/category-pills"
import { FlashSale } from "@/components/dashboard/flash-sale"
import { ProductShelf } from "@/components/dashboard/product-shelf"
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

interface FlashItem {
  id: string
  storeName: string
  productName: string
  price: number
  originalPrice: number
  discount: number
}

const CATEGORIES = [
  { label: "Semua", value: "all" },
  { label: "Denim", value: "denim" },
  { label: "Katun", value: "cotton" },
  { label: "Polyester", value: "polyester" },
  { label: "Campuran", value: "mixed" },
  { label: "Grade A", value: "A", type: "grade" as const },
  { label: "Grade B", value: "B", type: "grade" as const },
  { label: "Grade C", value: "C", type: "grade" as const },
  { label: "Lainnya", value: "other" },
]

function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="aspect-[4/3] w-full animate-pulse bg-tenunara-teal/10" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-3/4 animate-pulse rounded bg-tenunara-teal/10" />
            <div className="h-3 w-full animate-pulse rounded bg-tenunara-teal/10" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-tenunara-teal/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PengrajinDashboard() {
  const router = useRouter()
  const [products, setProducts] = useState<DashboardProduct[]>([])
  const [activeCategory, setActiveCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/products/dashboard?limit=50")
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat produk")
        return res.json()
      })
      .then((json) => {
        setProducts(json.data || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const filteredProducts = products.filter((p) => {
    if (activeCategory === "all") return true
    if (["denim", "cotton", "polyester", "mixed", "other"].includes(activeCategory)) {
      // Map frontend category values to whatever the API returns
      return p.fabric_name?.toLowerCase().includes(activeCategory)
    }
    if (["A", "B", "C"].includes(activeCategory)) {
      return p.final_grade === activeCategory
    }
    return true
  })

  // Generate flash sale items from products (take items with discount-like prices)
  const flashItems: FlashItem[] = products.slice(0, 5).map((p, i) => ({
    id: `flash-${p.id}`,
    storeName: p.umkm.store_name,
    productName: p.fabric_name,
    price: Math.round(p.price_per_kg * 0.75),
    originalPrice: p.price_per_kg,
    discount: [25, 30, 20, 15, 40][i % 5],
  }))

  const gradeAProducts = products.filter((p) => p.final_grade === "A")

  const handleProductClick = (id: string) => {
    router.push(`/dashboard/listings/${id}`)
  }

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-4 md:px-6">
        <div className="h-48 animate-pulse rounded-2xl bg-tenunara-teal/10" />
        <div className="h-8 animate-pulse rounded-full bg-tenunara-teal/10" />
        <ProductSkeletonGrid />
      </div>
    )
  }

  // ─── ERROR STATE ───
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 md:px-6">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  // ─── EMPTY STATE ───
  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 md:px-6">
        <HeroBanner />
        <div className="mt-8">
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title="Belum ada produk tersedia"
            description="Semua limbah kain dari UMKM akan tampil di sini"
            actionLabel="Cari dengan AI"
            onAction={() => router.push("/dashboard/browse")}
          />
        </div>
      </div>
    )
  }

  // ─── SUCCESS STATE ───
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-4 md:px-6">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Category Pills */}
      <CategoryPills
        categories={CATEGORIES}
        active={activeCategory}
        onChange={setActiveCategory}
      />

      {/* Flash Sale */}
      {activeCategory === "all" && <FlashSale items={flashItems} />}

      {/* Rekomendasi Untukmu */}
      <ProductShelf
        title="✨ Rekomendasi Untukmu"
        subtitle={activeCategory !== "all" ? `Menampilkan hasil untuk kategori ini` : "Produk pilihan untuk Anda"}
        products={filteredProducts}
        onProductClick={handleProductClick}
        linkHref="/dashboard/browse"
        emptyMessage="Tidak ada produk di kategori ini"
      />

      {/* Banner Inset — only on "all" view */}
      {activeCategory === "all" && (
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-tenunara-mint to-[#d4e8e8] px-6 py-6 md:px-8">
          <div className="max-w-md">
            <span className="inline-block rounded-full bg-tenunara-terracotta px-3 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
              ✦ Info
            </span>
            <h3 className="mt-2 font-heading text-lg font-bold text-tenunara-charcoal md:text-xl">
              Gabung Jadi Mitra UMKM
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-tenunara-teal md:text-sm">
              Jual limbah kain Anda di TENUNARA. Dapatkan akses ke ratusan pengrajin lokal yang membutuhkan bahan baku berkualitas.
            </p>
            <button
              onClick={() => router.push("/register?role=seller")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-tenunara-terracotta px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-tenunara-terracotta/90 md:text-sm"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Daftar Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Grade A Favorit — only on "all" view */}
      {activeCategory === "all" && gradeAProducts.length > 0 && (
        <ProductShelf
          title="🏆 Grade A Favorit"
          subtitle="Kualitas premium dari UMKM terpercaya"
          products={gradeAProducts}
          onProductClick={handleProductClick}
          linkHref="/dashboard/browse"
          emptyMessage="Belum ada produk Grade A"
        />
      )}

      {/* Explore link */}
      <div className="flex justify-center pt-2">
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
