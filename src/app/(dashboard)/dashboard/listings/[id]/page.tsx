"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft,
  ImageOff,
  Store,
  Package,
  Edit3,
  Trash2,
  ShoppingCart,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Scale,
} from "lucide-react"
import { GradeBadge } from "@/components/listing/grade-badge"
import { ConfirmDialog } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate, formatNumber, cn } from "@/lib/utils"
import {
  PRODUCTION_SOURCE_LABEL,
  HYGIENE_STATUS_LABEL,
  AI_SIZE_RANGE_LABEL,
  DEFECT_TYPE_LABEL,
  GRADE_BG,
  GRADE_TEXT,
} from "@/lib/constants"
import { deleteProduct } from "@/lib/api"
import type { ProductRow, ProductDefectDetail, Grade, UserRole } from "@/lib/types"

interface ProductDetail extends ProductRow {
  fabric_name: string
  fabric_category: string
  defects: ProductDefectDetail[]
  seller: {
    nama_penjual: string
    nama_toko: string
    kota: string
  } | null
}

function Skeleton() {
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
          <div className="h-12 w-full animate-pulse rounded-xl bg-tenunara-teal/10" />
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

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Read current user info
  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("sb-user-id") || "" : ""
  const currentUserRole = (typeof window !== "undefined" ? localStorage.getItem("sb-user-role") : null) as UserRole | null

  // Fetch product
  useEffect(() => {
    const token = localStorage.getItem("sb-access-token")
    if (!token) {
      router.push("/login")
      return
    }

    setLoading(true)
    setError(null)

    fetch(`/api/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 404) return null
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || "Gagal memuat detail produk")
        }
        return res.json()
      })
      .then((json) => {
        if (!json?.data) {
          setProduct(null)
          setLoading(false)
          return
        }

        const p = json.data as ProductDetail

        // Another UMKM → redirect
        if (currentUserRole === "umkm" && p.umkm_id !== currentUserId) {
          router.push("/dashboard")
          return
        }

        setProduct(p)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id, router, currentUserId, currentUserRole])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await deleteProduct(id)
      router.push("/dashboard/listings")
    } catch (err) {
      console.error("Delete failed:", err)
      setDeleting(false)
      setDeleteOpen(false)
    }
  }, [id, router])

  // ── Loading ──
  if (loading) return <Skeleton />

  // ── Error ──
  if (error) {
    return (
      <div className="mx-auto max-w-4xl pt-8">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-12 text-center shadow-sm">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <div>
            <p className="font-semibold text-tenunara-charcoal">Gagal memuat produk</p>
            <p className="mt-1 text-sm text-tenunara-teal">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="rounded-xl bg-tenunara-terracotta px-6 py-2 text-sm font-semibold text-white hover:bg-tenunara-terracotta/90">
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  // ── Not found ──
  if (!product) {
    return (
      <div className="mx-auto max-w-4xl pt-8">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-12 text-center shadow-sm">
          <Package className="h-12 w-12 text-tenunara-teal/30" />
          <div>
            <p className="font-semibold text-tenunara-charcoal">Produk tidak ditemukan</p>
            <p className="mt-1 text-sm text-tenunara-teal">Produk yang Anda cari tidak tersedia atau telah dihapus.</p>
          </div>
          <Button onClick={() => router.push("/dashboard/listings")} className="rounded-xl bg-tenunara-terracotta px-6 py-2 text-sm font-semibold text-white hover:bg-tenunara-terracotta/90">
            Kembali
          </Button>
        </div>
      </div>
    )
  }

  // ── Role checks ──
  const isOwner = product.umkm_id === currentUserId
  const isCustomer = currentUserRole === "pengrajin" || currentUserRole === "buyer"
  const isSold = product.status === "sold"

  // Derived display values
  const colorName = product.ai_dominant_color?.split(";")[1] || product.ai_dominant_color || "-"
  const grade: Grade = product.final_grade || product.ai_suggested_grade || "B"
  const images = Array.isArray(product.images_url) ? product.images_url : []
  const mainImage = images[selectedImage] || null
  const title = `${product.fabric_name || "Kain"} ${product.total_weight_kg}kg`
  const totalPrice = product.price_per_kg * quantity

  return (
    <div className="mx-auto max-w-4xl">
      {/* ── Back ── */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-tenunara-teal transition-colors duration-200 hover:text-tenunara-charcoal"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* ════ LEFT COLUMN: Image gallery ════ */}
        <div className="lg:col-span-3">
          {/* Main image */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-tenunara-mint shadow-sm">
            {imgError || !mainImage ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <ImageOff className="mx-auto h-12 w-12 text-tenunara-teal/30" />
                  <p className="mt-2 text-sm text-tenunara-teal/50">Foto tidak tersedia</p>
                </div>
              </div>
            ) : (
              <Image
                src={mainImage}
                alt={title}
                fill
                className="object-cover"
                onError={() => setImgError(true)}
              />
            )}

            {/* Grade badge */}
            <div className="absolute left-4 top-4">
              <GradeBadge grade={grade} size="md" />
            </div>

            {/* Sold overlay */}
            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="rounded-full bg-white px-6 py-2 text-base font-bold text-tenunara-charcoal shadow-sm">
                  TERJUAL
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                    i === selectedImage
                      ? "border-tenunara-terracotta"
                      : "border-transparent hover:border-tenunara-teal/30",
                  )}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Defects section (AI detected) */}
          {product.defects && product.defects.length > 0 && (
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-tenunara-teal">
                Cacat Terdeteksi (AI)
              </h3>
              <div className="space-y-1.5">
                {product.defects.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                    <span className="text-sm text-tenunara-charcoal">
                      {DEFECT_TYPE_LABEL[d.defect_type] || d.defect_type}
                    </span>
                    <span className="text-xs text-tenunara-teal">
                      {d.defect_percentage}% area
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ════ RIGHT COLUMN: Info + Actions ════ */}
        <div className="lg:col-span-2">
          <div className="space-y-5">
            {/* Title + status */}
            <div>
              <h1 className="text-xl font-bold leading-snug text-tenunara-charcoal">
                {title}
              </h1>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-block rounded-full px-3 py-0.5 text-xs font-semibold",
                    product.status === "published"
                      ? "bg-grade-success/10 text-grade-success"
                      : product.status === "sold"
                        ? "bg-tenunara-teal/10 text-tenunara-teal"
                        : product.status === "draft"
                          ? "bg-grade-warning/10 text-grade-warning"
                          : "bg-tenunara-mint text-tenunara-teal",
                  )}
                >
                  {product.status === "published"
                    ? "Aktif"
                    : product.status === "draft"
                      ? "Draft"
                      : product.status === "sold"
                        ? "Terjual"
                        : product.status === "archived"
                          ? "Diarsipkan"
                          : product.status}
                </span>
                <span className="text-xs text-tenunara-teal/60">
                  {formatDate(product.created_at)}
                </span>
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="text-2xl font-bold text-tenunara-terracotta">
                {formatCurrency(product.price_per_kg)}
                <span className="text-sm font-normal text-tenunara-teal"> /kg</span>
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-sm text-tenunara-teal">
                  {formatNumber(product.total_weight_kg)} kg tersedia
                </p>
                {product.is_negotiable && (
                  <span className="rounded-full bg-tenunara-mint px-2 py-0.5 text-[10px] font-medium text-tenunara-terracotta">
                    Bisa Nego
                  </span>
                )}
              </div>
            </div>

            {/* Specs */}
            <div className="rounded-2xl bg-tenunara-mint/30 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tenunara-teal">
                Spesifikasi
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <Spec label="Jenis Kain" value={product.fabric_name || "-"} />
                <Spec label="Warna Dominan" value={colorName} />
                <Spec label="Ukuran" value={AI_SIZE_RANGE_LABEL[product.ai_size_range ?? ""] || product.ai_size_range || "-"} />
                <Spec label="Grade" value={`Grade ${grade}`} />
                <Spec label="Sumber" value={PRODUCTION_SOURCE_LABEL[product.production_source] || product.production_source} />
                <Spec label="Kebersihan" value={HYGIENE_STATUS_LABEL[product.hygiene_status] || product.hygiene_status} />
                <Spec label="Berat" value={`${formatNumber(product.total_weight_kg)} kg`} />
                <Spec label="Harga" value={`${formatCurrency(product.price_per_kg)} /kg`} />
              </div>
            </div>

            {/* Additional details */}
            {(product.fiber_composition || product.minimum_order_kg || product.has_odor) && (
              <div className="rounded-2xl border border-border p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-tenunara-teal">
                  Detail Tambahan
                </h3>
                <div className="space-y-2">
                  {product.fiber_composition && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-tenunara-teal" />
                      <span className="text-tenunara-charcoal">{product.fiber_composition}</span>
                    </div>
                  )}
                  {product.minimum_order_kg && (
                    <div className="flex items-center gap-2 text-sm">
                      <Scale className="h-4 w-4 text-tenunara-teal" />
                      <span className="text-tenunara-charcoal">Min. order {formatNumber(product.minimum_order_kg)} kg</span>
                    </div>
                  )}
                  {product.has_odor && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-grade-warning" />
                      <span className="text-grade-warning">Kain memiliki bau</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes (description) */}
            {product.notes && (
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-tenunara-teal">
                  Catatan
                </h3>
                <p className="text-sm leading-relaxed text-tenunara-charcoal">
                  {product.notes}
                </p>
              </div>
            )}

            {/* AI Reasoning */}
            {product.ai_reasoning && (
              <div className="rounded-2xl bg-tenunara-mint/30 p-3">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-tenunara-terracotta" />
                  <div>
                    <p className="text-xs font-semibold text-tenunara-teal">Analisis AI</p>
                    <p className="mt-0.5 text-sm text-tenunara-charcoal">{product.ai_reasoning}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Seller info */}
            {product.seller && (
              <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tenunara-terracotta/10 text-tenunara-terracotta">
                  <Store className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-tenunara-charcoal">
                    {product.seller.nama_penjual}
                  </p>
                  <p className="text-xs text-tenunara-teal">
                    {product.seller.nama_toko}{product.seller.kota ? ` • ${product.seller.kota}` : ""}
                  </p>
                </div>
              </div>
            )}

            {/* ════ ACTION BUTTONS ════ */}

            {/* Owner: Edit + Delete */}
            {isOwner && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push(`/dashboard/listings/${id}/edit`)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-tenunara-terracotta bg-white px-5 py-3 text-sm font-semibold text-tenunara-terracotta transition-colors duration-200 hover:bg-tenunara-terracotta/5"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                  {!isSold && (
                    <Button
                      onClick={() => setDeleteOpen(true)}
                      variant="outline"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-destructive/30 px-5 py-3 text-sm font-medium text-destructive transition-colors duration-200 hover:bg-destructive/5"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Customer: Buy */}
            {isCustomer && !isSold && (
              <div className="space-y-3 rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-tenunara-charcoal" htmlFor="qty">
                    Jumlah (kg)
                  </label>
                  <Input
                    id="qty"
                    type="number"
                    min={1}
                    max={product.total_weight_kg}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(Number(e.target.value), product.total_weight_kg))}
                    className="w-24"
                  />
                  <span className="text-xs text-tenunara-teal">
                    Maks {formatNumber(product.total_weight_kg)} kg
                  </span>
                </div>
                {product.minimum_order_kg && quantity < product.minimum_order_kg && (
                  <p className="text-xs text-grade-warning">
                    Minimum pembelian {formatNumber(product.minimum_order_kg)} kg
                  </p>
                )}
                <Button className="flex w-full items-center justify-center gap-2 rounded-xl bg-tenunara-terracotta px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-tenunara-terracotta/90">
                  <ShoppingCart className="h-4 w-4" />
                  Pesan &middot; {formatCurrency(totalPrice)}
                </Button>
              </div>
            )}

            {/* Sold notice for customers */}
            {isCustomer && isSold && (
              <div className="rounded-2xl bg-tenunara-mint/50 p-4 text-center">
                <p className="text-sm font-medium text-tenunara-teal">Produk ini sudah terjual</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Produk"
        description="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
