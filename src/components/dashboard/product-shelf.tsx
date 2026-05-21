"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOff, Heart } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

// Re-using the existing DashboardProduct type
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

interface ProductShelfProps {
  title: string
  subtitle?: string
  products: DashboardProduct[]
  linkHref?: string
  onProductClick: (id: string) => void
  emptyMessage?: string
  /** If set, only show products matching this grade */
  gradeFilter?: string
}

function MarketplaceCard({
  product,
  onClick,
}: {
  product: DashboardProduct
  onClick: (id: string) => void
}) {
  const [imgError, setImgError] = useState(false)
  const [imgLoading, setImgLoading] = useState(true)

  const grade = product.final_grade as "A" | "B" | "C" | null

  const gradeStyle = grade === "A"
    ? "bg-[#E8F5E9] text-[#2E7D32]"
    : grade === "B"
      ? "bg-[#FFF3E0] text-[#E65100]"
      : grade === "C"
        ? "bg-[#E3F2FD] text-[#1565C0]"
        : "bg-tenunara-mint text-tenunara-teal"

  return (
    <button
      onClick={() => onClick(product.id)}
      className="group overflow-hidden rounded-xl border border-border bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-tenunara-canvas">
        {imgLoading && !imgError && (
          <div className="absolute inset-0 animate-pulse bg-tenunara-teal/10" />
        )}
        {imgError ? (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-6 w-6 text-tenunara-teal/30" />
          </div>
        ) : (
          <Image
            src={product.images_url || "/dummy1.png"}
            alt={product.fabric_name}
            fill
            className={cn(
              "object-cover transition-all duration-300 group-hover:scale-105",
              imgLoading ? "opacity-0" : "opacity-100",
            )}
            onLoad={() => setImgLoading(false)}
            onError={() => { setImgLoading(false); setImgError(true) }}
          />
        )}

        {/* Grade badge */}
        {grade && (
          <span className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold ${gradeStyle}`}>
            Grade {grade}
          </span>
        )}

        {/* Heart button */}
        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-tenunara-teal opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Heart className="h-3.5 w-3.5" />
        </span>

        {/* Weight tag */}
        <span className="absolute bottom-2 left-2 rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-medium text-tenunara-charcoal backdrop-blur-sm">
          {product.total_weight_kg} kg
        </span>
      </div>

      {/* Info */}
      <div className="space-y-1 p-3">
        <p className="truncate text-[11px] text-tenunara-teal">
          {product.umkm.store_name}
        </p>
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-tenunara-charcoal group-hover:text-tenunara-terracotta">
          {product.fabric_name}
        </p>
        <p className="text-sm font-bold text-tenunara-terracotta">
          {formatCurrency(product.price_per_kg)}
          <span className="text-[10px] font-normal text-tenunara-teal"> /kg</span>
        </p>
        <p className="flex items-center gap-1 text-[10px] text-tenunara-teal/60">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          {product.umkm.kota}
        </p>
      </div>
    </button>
  )
}

export function ProductShelf({
  title,
  subtitle,
  products,
  linkHref,
  onProductClick,
  emptyMessage,
  gradeFilter,
}: ProductShelfProps) {
  const filtered = gradeFilter
    ? products.filter((p) => p.final_grade === gradeFilter)
    : products

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-bold text-tenunara-charcoal">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-tenunara-teal/60">{subtitle}</p>
          )}
        </div>
        {linkHref && (
          <a
            href={linkHref}
            className="text-xs font-medium text-tenunara-terracotta hover:opacity-80"
          >
            Lihat Semua →
          </a>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-border bg-white text-sm text-tenunara-teal/50">
          {emptyMessage || "Belum ada produk"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <MarketplaceCard
              key={product.id}
              product={product}
              onClick={onProductClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
