"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
// TODO: Replace mock fetch with real API call when BE endpoint is ready
import Image from "next/image"
import { ArrowLeft, ImageOff, MapPin, Store, Package, Edit3, Archive, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GradeBadge } from "@/components/listing/grade-badge"
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/shared"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"
import { MATERIAL_LABEL, COLOR_LABEL, SIZE_LABEL, CONDITION_LABEL } from "@/lib/constants"
import type { ListingWithSeller } from "@/lib/types"

// TODO: Replace mock with real API call:
// GET /api/listings/[id]
async function fetchListing(_id: string): Promise<ListingWithSeller> {
  const res = await fetch("/data/temp_data_listing_detail.json")
  if (!res.ok) throw new Error("Gagal memuat detail listing")
  const json = await res.json()
  return json.data as ListingWithSeller
}

// Read actual user ID from localStorage (set during login/register)
const getUserId = (): string => {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("sb-user-id") || ""
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [listing, setListing] = useState<ListingWithSeller | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    fetchListing(id)
      .then((data) => {
        setListing(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="h-6 w-24 animate-pulse rounded-lg bg-tenunara-teal/10" />
        <div className="mt-6 grid gap-8 lg:grid-cols-5">
          <div className="aspect-[4/3] w-full animate-pulse rounded-3xl bg-tenunara-teal/10 lg:col-span-3" />
          <div className="space-y-4 lg:col-span-2">
            <div className="h-8 w-3/4 animate-pulse rounded-lg bg-tenunara-teal/10" />
            <div className="h-5 w-1/3 animate-pulse rounded-lg bg-tenunara-teal/10" />
            <div className="h-12 w-1/2 animate-pulse rounded-lg bg-tenunara-teal/10" />
            <div className="h-24 w-full animate-pulse rounded-xl bg-tenunara-teal/10" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl pt-8">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-4xl pt-8">
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Listing tidak ditemukan"
          description="Listing yang Anda cari tidak tersedia atau telah dihapus."
          actionLabel="Kembali"
          onAction={() => router.push("/dashboard/listings")}
        />
      </div>
    )
  }

  const isSeller = listing.seller_id === getUserId()
  const isSold = listing.status === "sold"

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-tenunara-teal transition-colors duration-200 hover:text-tenunara-charcoal"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left: Image hero */}
        <div className="lg:col-span-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-tenunara-mint shadow-sm">
            {imgError ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <ImageOff className="mx-auto h-12 w-12 text-tenunara-teal/30" />
                  <p className="mt-2 text-sm text-tenunara-teal/50">Foto tidak tersedia</p>
                </div>
              </div>
            ) : (
              // TODO: Replace dummy image with actual listing photo
              <Image
                src={listing.image_url || "/dummy1.png"}
                alt={listing.title}
                fill
                className="object-cover"
                onError={() => setImgError(true)}
              />
            )}

            {/* Grade badge + Sold overlay */}
            <div className="absolute left-4 top-4">
              <GradeBadge grade={listing.grade} size="md" />
            </div>
            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="rounded-full bg-white px-6 py-2 text-base font-bold text-tenunara-charcoal shadow-sm">
                  TERJUAL
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-2">
          <div className="space-y-5">
            {/* Title & status */}
            <div>
              <h1 className="text-xl font-bold leading-snug text-tenunara-charcoal">
                {listing.title}
              </h1>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                    listing.status === "active"
                      ? "bg-grade-success/10 text-grade-success"
                      : listing.status === "sold"
                        ? "bg-tenunara-teal/10 text-tenunara-teal"
                        : "bg-tenunara-mint text-tenunara-teal"
                  }`}
                >
                  {listing.status === "active"
                    ? "Aktif"
                    : listing.status === "sold"
                      ? "Terjual"
                      : "Diarsipkan"}
                </span>
                <span className="text-xs text-tenunara-teal/60">
                  {formatDate(listing.created_at)}
                </span>
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="text-2xl font-bold text-tenunara-terracotta">
                {formatCurrency(listing.price_per_kg)}
                <span className="text-sm font-normal text-tenunara-teal"> /kg</span>
              </p>
              <p className="mt-0.5 text-sm text-tenunara-teal">
                {formatNumber(listing.quantity_kg)} kg tersedia
              </p>
            </div>

            {/* Specs grid */}
            <div className="rounded-2xl bg-tenunara-mint/30 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tenunara-teal">
                Spesifikasi
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <Spec label="Material" value={MATERIAL_LABEL[listing.material] || listing.material} />
                <Spec label="Warna" value={COLOR_LABEL[listing.color] || listing.color} />
                <Spec label="Ukuran" value={SIZE_LABEL[listing.size_estimate] || listing.size_estimate} />
                <Spec label="Kondisi" value={CONDITION_LABEL[listing.condition] || listing.condition} />
                <Spec label="Grade" value={`Grade ${listing.grade}`} />
                <Spec label="Kuantitas" value={`${formatNumber(listing.quantity_kg)} kg`} />
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-tenunara-teal">
                  Deskripsi
                </h3>
                <p className="text-sm leading-relaxed text-tenunara-charcoal">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Seller info */}
            <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tenunara-terracotta/10 text-tenunara-terracotta">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-tenunara-charcoal">
                  {listing.seller_name}
                </p>
                {listing.seller_company && (
                  <p className="text-xs text-tenunara-teal">{listing.seller_company}</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            {isSeller ? (
              <div className="flex gap-3">
                <Button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-tenunara-terracotta bg-white px-5 py-3 text-sm font-semibold text-tenunara-terracotta transition-colors duration-200 hover:bg-tenunara-terracotta/5">
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium text-tenunara-teal transition-colors duration-200 hover:bg-tenunara-mint/50"
                >
                  <Archive className="h-4 w-4" />
                  Arsipkan
                </Button>
              </div>
            ) : (
              !isSold && (
                <div className="space-y-3 rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-tenunara-charcoal" htmlFor="qty">
                      Jumlah (kg)
                    </label>
                    <Input
                      id="qty"
                      type="number"
                      min={1}
                      max={listing.quantity_kg}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-xs text-tenunara-teal">
                      Maks {formatNumber(listing.quantity_kg)} kg
                    </span>
                  </div>
                  <Button className="flex w-full items-center justify-center gap-2 rounded-xl bg-tenunara-terracotta px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-tenunara-terracotta/90">
                    <ShoppingCart className="h-4 w-4" />
                    Pesan &middot; {formatCurrency(listing.price_per_kg * quantity)}
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-tenunara-teal/70">{label}</p>
      <p className="text-sm font-medium text-tenunara-charcoal">{value}</p>
    </div>
  )
}
