"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOff, Package } from "lucide-react"
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils"
import { MATERIAL_LABEL } from "@/lib/constants"
import { GradeBadge } from "@/components/listing/grade-badge"
import type { ListingWithSeller } from "@/lib/types"

interface ListingCardProps {
  listing: ListingWithSeller
  onClick: (id: string) => void
  variant?: "grid" | "list"
}

export function ListingCard({ listing, onClick, variant = "grid" }: ListingCardProps) {
  const [imgError, setImgError] = useState(false)
  const [imgLoading, setImgLoading] = useState(true)
  const isSold = listing.status === "sold"

  if (variant === "list") {
    return (
      <button
        onClick={() => onClick(listing.id)}
        className="group relative flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        {/* Image */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-tenunara-mint">
          {imgLoading && !imgError && (
            <div className="absolute inset-0 animate-pulse bg-tenunara-teal/10" />
          )}
          {imgError ? (
            <div className="flex h-full items-center justify-center">
              <ImageOff className="h-6 w-6 text-tenunara-teal/30" />
            </div>
          ) : (
            <Image
              // TODO: Replace dummy image with actual listing photo from seller
              src={listing.image_url || "/dummy1.png"}
              alt={listing.title}
              fill
              className={cn(
                "object-cover transition-opacity duration-300",
                imgLoading ? "opacity-0" : "opacity-100",
              )}
              onLoad={() => setImgLoading(false)}
              onError={() => {
                setImgLoading(false)
                setImgError(true)
              }}
            />
          )}
          {isSold && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-tenunara-charcoal">
                TERJUAL
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-tenunara-charcoal group-hover:text-tenunara-terracotta">
              {listing.title}
            </h3>
            <GradeBadge grade={listing.grade} size="sm" />
          </div>
          <p className="mt-0.5 text-xs text-tenunara-teal">
            {MATERIAL_LABEL[listing.material]} &middot; {listing.quantity_kg} kg
          </p>
          <p className="mt-1 text-sm font-bold text-tenunara-terracotta">
            {formatCurrency(listing.price_per_kg)}
            <span className="text-xs font-normal text-tenunara-teal"> /kg</span>
          </p>
          <p className="mt-0.5 text-[11px] text-tenunara-teal/60">
            {formatRelativeTime(listing.created_at)}
          </p>
        </div>
      </button>
    )
  }

  // Grid variant
  return (
    <button
      onClick={() => onClick(listing.id)}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
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
            // TODO: Replace dummy image with actual listing photo from seller
            src={listing.image_url || "/dummy1.png"}
            alt={listing.title}
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
        <div className="absolute left-3 top-3">
          <GradeBadge grade={listing.grade} size="sm" />
        </div>

        {/* Sold overlay */}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white px-4 py-1 text-sm font-bold text-tenunara-charcoal">
              TERJUAL
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-4 text-left">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-tenunara-charcoal group-hover:text-tenunara-terracotta">
          {listing.title}
        </h3>
        <p className="text-xs text-tenunara-teal">
          {MATERIAL_LABEL[listing.material]} &middot; {listing.quantity_kg} kg
        </p>
        <p className="mt-auto pt-1 text-base font-bold text-tenunara-terracotta">
          {formatCurrency(listing.price_per_kg)}
          <span className="text-xs font-normal text-tenunara-teal"> /kg</span>
        </p>
        <p className="text-[11px] text-tenunara-teal/60">
          {listing.seller_name}
          {listing.seller_company && ` · ${listing.seller_company}`}
        </p>
      </div>
    </button>
  )
}
