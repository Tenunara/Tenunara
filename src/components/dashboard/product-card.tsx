"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOff, Package } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { GradeBadge } from "@/components/listing/grade-badge"

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

interface ProductCardProps {
  product: DashboardProduct
  onClick: (id: string) => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const [imgLoading, setImgLoading] = useState(true)

  return (
    <button
      onClick={() => onClick(product.id)}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-tenunara-mint">
        {imgLoading && !imgError && (
          <div className="absolute inset-0 animate-pulse bg-tenunara-teal/10" />
        )}
        {imgError ? (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-8 w-8 text-tenunara-teal/30" />
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
            onError={() => {
              setImgLoading(false)
              setImgError(true)
            }}
          />
        )}

        {/* Grade badge overlay */}
        {product.final_grade && (
          <div className="absolute left-3 top-3">
            <GradeBadge grade={product.final_grade as "A" | "B" | "C"} size="sm" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-tenunara-charcoal group-hover:text-tenunara-terracotta">
          {product.fabric_name}
        </h3>
        <p className="text-xs text-tenunara-teal">
          {product.umkm.store_name}
          {product.umkm.kota && ` · ${product.umkm.kota}`}
        </p>
        <p className="text-xs text-tenunara-teal/70">
          {product.total_weight_kg} kg tersedia
        </p>
        <p className="mt-auto pt-1 text-base font-bold text-tenunara-terracotta">
          {formatCurrency(product.price_per_kg)}
          <span className="text-xs font-normal text-tenunara-teal"> /kg</span>
        </p>
      </div>
    </button>
  )
}
