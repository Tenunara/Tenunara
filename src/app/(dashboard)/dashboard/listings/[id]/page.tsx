"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ImageOff,
  Store,
  Package,
  Edit3,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Clock,
  Scale,
  ChevronDown,
  ChevronUp,
  Share2,
  Minus,
  Plus,
  Loader2,
  AlertTriangle,
  BadgeCheck,
  Building2,
  Zap,
  Ruler,
  Droplets,
  Eye,
} from "lucide-react";
import { GradeBadge } from "@/components/listing/grade-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, formatNumber, cn } from "@/lib/utils";
import {
  PRODUCTION_SOURCE_LABEL,
  HYGIENE_STATUS_LABEL,
  AI_SIZE_RANGE_LABEL,
  DEFECT_TYPE_LABEL,
  GRADE_BG,
  GRADE_TEXT,
} from "@/lib/constants";
import { deleteProduct, createOrder } from "@/lib/api";
import { useCart } from "@/contexts/cart-context"
import type {
  ProductRow,
  ProductDefectDetail,
  Grade,
  UserRole,
} from "@/lib/types";

interface ProductDetail extends ProductRow {
  fabric_name: string;
  fabric_category: string;
  defects: ProductDefectDetail[];
  available_stock_kg?: number;
  seller: {
    nama_penjual: string;
    nama_toko: string;
    kota: string;
  } | null;
}

// ─── Skeleton ─────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="h-5 w-24 animate-pulse rounded-lg bg-tenunara-teal/10" />
      <div className="mt-4 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-tenunara-teal/10" />
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 w-16 animate-pulse rounded-xl bg-tenunara-teal/10" />
            ))}
          </div>
        </div>
        <div className="space-y-5 lg:col-span-5">
          <div className="h-6 w-20 animate-pulse rounded-full bg-tenunara-teal/10" />
          <div className="h-7 w-full animate-pulse rounded-lg bg-tenunara-teal/10" />
          <div className="h-5 w-2/3 animate-pulse rounded-lg bg-tenunara-teal/10" />
          <div className="h-10 w-1/2 animate-pulse rounded-lg bg-tenunara-teal/10" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-tenunara-teal/10" />
          <div className="h-16 w-full animate-pulse rounded-xl bg-tenunara-teal/10" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-tenunara-teal/10" />
        </div>
      </div>
    </div>
  );
}

// ─── Info Row ──────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className={cn("h-4 w-4 shrink-0", color || "text-tenunara-teal")} />
      <span className="text-sm text-tenunara-teal/70 min-w-[80px]">{label}</span>
      <span className="text-sm font-medium text-tenunara-charcoal">{value}</span>
    </div>
  );
}

// ─── Tab Button ────────────────────────────────────────────────
function TabBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap pb-3 text-sm font-semibold transition-colors relative",
        active ? "text-tenunara-terracotta" : "text-tenunara-teal/60 hover:text-tenunara-teal",
      )}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-tenunara-terracotta rounded-full" />
      )}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────
export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"deskripsi" | "spesifikasi" | "cacat" | "analisis">("deskripsi");
  const [descExpanded, setDescExpanded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  // Read current user info
  const currentUserId =
    typeof window !== "undefined"
      ? localStorage.getItem("sb-user-id") || ""
      : "";
  const currentUserRole = (
    typeof window !== "undefined" ? localStorage.getItem("sb-user-role") : null
  ) as UserRole | null;

  // Fetch product
  useEffect(() => {
    const token = localStorage.getItem("sb-access-token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 404) return null;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Gagal memuat detail produk");
        }
        return res.json();
      })
      .then((json) => {
        if (!json?.data) {
          setProduct(null);
          setLoading(false);
          return;
        }

        const p = json.data as ProductDetail;

        // Another UMKM → redirect
        if (currentUserRole === "umkm" && p.umkm_id !== currentUserId) {
          router.push("/dashboard");
          return;
        }

        setProduct(p);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id, router, currentUserId, currentUserRole]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteProduct(id);
      router.push("/dashboard/listings");
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleting(false);
    }
  }, [id, router]);

  const handleOrder = useCallback(async () => {
    if (!id || !quantity) return;
    setCreating(true);
    try {
      const order = await createOrder({
        items: [{ product_id: id, quantity_kg: quantity }],
      });
      router.push(`/dashboard/orders/${order.id}`);
    } catch (err: any) {
      alert(err.message);
      setCreating(false);
    }
  }, [id, quantity, router]);

  const handleAddToCart = useCallback(async () => {
    if (!id || !quantity) return;
    try {
      await addItem(id, quantity);
      setShowAdded(true);
      setTimeout(() => setShowAdded(false), 2000);
    } catch (err: any) {
      alert(err.message);
    }
  }, [id, quantity, addItem]);

  // ── Loading ──
  if (loading) return <Skeleton />;

  // ── Error ──
  if (error) {
    return (
      <div className="mx-auto max-w-4xl pt-8">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-12 text-center shadow-sm border border-border">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <div>
            <p className="font-semibold text-tenunara-charcoal">Gagal memuat produk</p>
            <p className="mt-1 text-sm text-tenunara-teal">{error}</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-tenunara-terracotta px-6 py-2 text-sm font-semibold text-white hover:bg-tenunara-terracotta/90"
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!product) {
    return (
      <div className="mx-auto max-w-4xl pt-8">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-12 text-center shadow-sm border border-border">
          <Package className="h-12 w-12 text-tenunara-teal/30" />
          <div>
            <p className="font-semibold text-tenunara-charcoal">Produk tidak ditemukan</p>
            <p className="mt-1 text-sm text-tenunara-teal">Produk yang Anda cari tidak tersedia atau telah dihapus.</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/listings")}
            className="rounded-xl bg-tenunara-terracotta px-6 py-2 text-sm font-semibold text-white hover:bg-tenunara-terracotta/90"
          >
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  // ── Role checks ──
  const isOwner = product.umkm_id === currentUserId;
  const isCustomer = currentUserRole === "pengrajin" || currentUserRole === "buyer";
  const isSold = product.status === "sold";

  // Derived values
  const colorName = product.ai_dominant_color?.split(";")[1] || product.ai_dominant_color || "-";
  const grade: Grade = product.final_grade || product.ai_suggested_grade || "B";
  const images = Array.isArray(product.images_url) ? product.images_url : [];
  const mainImage = images[selectedImage] || null;
  const title = `${product.fabric_name || "Kain"} ${product.total_weight_kg}kg - Grade ${grade}`;
  const availableStock = product.available_stock_kg ?? product.total_weight_kg;
  const totalPrice = product.price_per_kg * quantity;
  const statusLabel =
    product.status === "published" ? "Aktif" :
    product.status === "draft" ? "Draft" :
    product.status === "sold" ? "Terjual" :
    product.status === "archived" ? "Diarsipkan" : product.status;

  return (
    <div className="mx-auto max-w-7xl">
      {/* ── Back ── */}
      <button
        onClick={() => router.back()}
        className="group mb-4 flex items-center gap-2 text-sm font-medium text-tenunara-teal transition-colors hover:text-tenunara-charcoal"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Kembali
      </button>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        {/* ════════════════════════════════════════════════════════
           LEFT COLUMN: Image Gallery + Detail Tabs
           ════════════════════════════════════════════════════════ */}
        <div className="space-y-5 lg:col-span-7 lg:pl-6">
          {/* ── Main Image ── */}
          <div
            ref={galleryRef}
            className={cn(
              "relative overflow-hidden rounded-2xl bg-tenunara-mint border border-border/50 transition-all duration-300 ml-36",
              zoomed ? "cursor-zoom-out" : "cursor-zoom-in",
            )}
            style={{ aspectRatio: "1/1", maxHeight: zoomed ? "500px" : "400px" }}
            onClick={() => setZoomed(!zoomed)}
          >
            {imgError || !mainImage ? (
              <div className="flex h-full items-center justify-center" style={{ minHeight: 300 }}>
                <div className="text-center">
                  <ImageOff className="mx-auto h-12 w-12 text-tenunara-teal/30" />
                  <p className="mt-2 text-sm text-tenunara-teal/50">Foto tidak tersedia</p>
                </div>
              </div>
            ) : (
              <div className="relative h-full w-full">
                <Image
                  src={mainImage}
                  alt={title}
                  fill
                  className={cn("object-cover transition-transform duration-300", zoomed && "scale-150")}
                  style={{ objectPosition: "center" }}
                  onError={() => setImgError(true)}
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                />
              </div>
            )}

            {/* Top badges */}
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <GradeBadge grade={grade} size="md" />
              {product.is_negotiable && (
                <span className="rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-tenunara-terracotta shadow-sm">
                  Bisa Nego
                </span>
              )}
            </div>

            {/* Share button */}
            <button
              onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(window.location.href); }}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-tenunara-teal shadow-sm transition-colors hover:bg-white"
            >
              <Share2 className="h-4 w-4" />
            </button>

            {/* Sold overlay */}
            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40" onClick={(e) => e.stopPropagation()}>
                <span className="rounded-full bg-white px-6 py-2 text-base font-bold text-tenunara-charcoal shadow-sm">
                  TERJUAL
                </span>
              </div>
            )}
          </div>

          {/* ── Thumbnail Strip ── */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 ml-36">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedImage(i); setZoomed(false); }}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
                    i === selectedImage
                      ? "border-tenunara-terracotta ring-1 ring-tenunara-terracotta/20"
                      : "border-border hover:border-tenunara-teal/30",
                  )}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* ── Detail Tabs (Desktop) ── */}
          <div className="hidden rounded-2xl bg-white border border-border/50 shadow-sm lg:block">
            <div className="flex gap-6 border-b border-border/50 px-6 pt-4">
              <TabBtn active={activeTab === "deskripsi"} onClick={() => setActiveTab("deskripsi")}>
                Deskripsi
              </TabBtn>
              <TabBtn active={activeTab === "spesifikasi"} onClick={() => setActiveTab("spesifikasi")}>
                Spesifikasi
              </TabBtn>
              {product.defects && product.defects.length > 0 && (
                <TabBtn active={activeTab === "cacat"} onClick={() => setActiveTab("cacat")}>
                  Cacat AI ({product.defects.length})
                </TabBtn>
              )}
              {product.ai_reasoning && (
                <TabBtn active={activeTab === "analisis"} onClick={() => setActiveTab("analisis")}>
                  Analisis AI
                </TabBtn>
              )}
            </div>

            <div className="px-6 py-5">
              {/* Deskripsi Tab */}
              {activeTab === "deskripsi" && (
                <div>
                  <p className="text-sm leading-relaxed text-tenunara-charcoal">
                    {product.notes && product.notes.length > 300
                      ? descExpanded
                        ? product.notes
                        : product.notes.slice(0, 300) + "..."
                      : product.notes || "Tidak ada deskripsi untuk produk ini."}
                  </p>
                  {product.notes && product.notes.length > 300 && (
                    <button
                      onClick={() => setDescExpanded(!descExpanded)}
                      className="mt-2 flex items-center gap-1 text-sm font-semibold text-tenunara-terracotta hover:text-tenunara-terracotta/80"
                    >
                      {descExpanded ? "Lihat Lebih Sedikit" : "Lihat Selengkapnya"}
                      {descExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              )}

              {/* Spesifikasi Tab */}
              {activeTab === "spesifikasi" && (
                <div className="divide-y divide-border/50">
                  <InfoRow icon={Building2} label="Jenis Kain" value={product.fabric_name || "-"} />
                  <InfoRow icon={Droplets} label="Kategori" value={product.fabric_category === "natural" ? "Alami" : product.fabric_category === "synthetic" ? "Sintetis" : "Campuran"} />
                  <InfoRow icon={Eye} label="Warna Dominan" value={colorName} />
                  <InfoRow icon={Ruler} label="Ukuran" value={AI_SIZE_RANGE_LABEL[product.ai_size_range || ""] || product.ai_size_range || "-"} />
                  <InfoRow icon={Zap} label="Sumber" value={PRODUCTION_SOURCE_LABEL[product.production_source] || product.production_source} />
                  <InfoRow icon={CheckCircle2} label="Kebersihan" value={HYGIENE_STATUS_LABEL[product.hygiene_status] || product.hygiene_status} color="text-grade-success" />
                  <InfoRow icon={Scale} label="Berat Total" value={`${formatNumber(product.total_weight_kg)} kg`} />
                  <InfoRow icon={Package} label="Stok Tersedia" value={`${formatNumber(availableStock)} kg`} />
                  {product.fiber_composition && (
                    <InfoRow icon={Droplets} label="Komposisi Serat" value={product.fiber_composition} />
                  )}
                  {product.minimum_order_kg && (
                    <InfoRow icon={Scale} label="Min. Pembelian" value={`${formatNumber(product.minimum_order_kg)} kg`} />
                  )}
                  {product.estimated_pieces && (
                    <InfoRow icon={Package} label="Estimasi Potongan" value={`${product.estimated_pieces} pcs`} />
                  )}
                  {product.has_odor && (
                    <InfoRow icon={AlertTriangle} label="Bau" value="Kain memiliki bau" color="text-grade-warning" />
                  )}
                </div>
              )}

              {/* Cacat AI Tab */}
              {activeTab === "cacat" && product.defects && (
                <div className="space-y-3">
                  {product.defects.length === 0 ? (
                    <p className="text-sm text-tenunara-teal">Tidak ada cacat terdeteksi pada kain ini.</p>
                  ) : (
                    product.defects.map((d, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-tenunara-mint/30 border border-border/50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={cn("h-4 w-4", d.defect_percentage > 10 ? "text-grade-warning" : "text-tenunara-teal")} />
                          <span className="text-sm font-medium text-tenunara-charcoal">
                            {DEFECT_TYPE_LABEL[d.defect_type] || d.defect_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-border">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                d.defect_percentage > 10 ? "bg-grade-warning" : "bg-tenunara-teal",
                              )}
                              style={{ width: `${Math.min(d.defect_percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-tenunara-teal">{d.defect_percentage}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Analisis AI Tab */}
              {activeTab === "analisis" && product.ai_reasoning && (
                <div className="rounded-xl bg-tenunara-mint/20 border border-tenunara-mint/50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tenunara-terracotta/10">
                      <Zap className="h-4 w-4 text-tenunara-terracotta" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-tenunara-charcoal">Analisis AI TENUNARA</p>
                      <p className="mt-2 text-sm leading-relaxed text-tenunara-teal">
                        {product.ai_reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
           RIGHT COLUMN: Product Info + Actions (Sticky)
           ════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5">
          <div className="space-y-4 lg:sticky lg:top-24">
            {/* ── Status Badge + Date ── */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                  product.status === "published"
                    ? "bg-grade-success/10 text-grade-success"
                    : product.status === "sold"
                      ? "bg-tenunara-teal/10 text-tenunara-teal"
                      : product.status === "draft"
                        ? "bg-grade-warning/10 text-grade-warning"
                        : "bg-tenunara-mint text-tenunara-teal",
                )}
              >
                {statusLabel}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-tenunara-teal/50">
                <Clock className="h-3 w-3" />
                {formatDate(product.created_at)}
              </span>
            </div>

            {/* ── Product Title ── */}
            <h1 className="text-xl font-bold leading-snug text-tenunara-charcoal lg:text-2xl">
              {title}
            </h1>

            {/* ── Price ── */}
            <div className="rounded-2xl bg-white border border-border/50 p-4 shadow-sm">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-tenunara-terracotta lg:text-4xl">
                  {formatCurrency(product.price_per_kg)}
                </span>
                <span className="text-sm font-medium text-tenunara-teal">/kg</span>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-sm text-tenunara-teal">
                  {formatNumber(availableStock)} kg tersedia
                </span>
              </div>
            </div>

            {/* ── Specs Summary ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white border border-border/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-tenunara-teal/60">Grade</p>
                <p className={cn("mt-0.5 text-sm font-bold", GRADE_TEXT[grade])}>Grade {grade}</p>
              </div>
              <div className="rounded-xl bg-white border border-border/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-tenunara-teal/60">Berat</p>
                <p className="mt-0.5 text-sm font-bold text-tenunara-charcoal">{formatNumber(product.total_weight_kg)} kg</p>
              </div>
              <div className="rounded-xl bg-white border border-border/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-tenunara-teal/60">Kain</p>
                <p className="mt-0.5 text-sm font-bold text-tenunara-charcoal truncate">{product.fabric_name || "-"}</p>
              </div>
              <div className="rounded-xl bg-white border border-border/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-tenunara-teal/60">Sumber</p>
                <p className="mt-0.5 text-sm font-bold text-tenunara-charcoal truncate">
                  {PRODUCTION_SOURCE_LABEL[product.production_source] || product.production_source}
                </p>
              </div>
            </div>

            {/* ── Store Info Card ── */}
            {product.seller && (
              <div className="rounded-2xl bg-white border border-border/50 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tenunara-terracotta/10">
                    <Store className="h-6 w-6 text-tenunara-terracotta" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-tenunara-charcoal truncate">
                        {product.seller.nama_toko || product.seller.nama_penjual}
                      </p>
                      <BadgeCheck className="h-4 w-4 shrink-0 text-grade-success" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-tenunara-teal mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {product.seller.kota || "Indonesia"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Owner Actions ── */}
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push(`/dashboard/listings/${id}/edit`)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-tenunara-terracotta bg-white px-5 py-3 text-sm font-bold text-tenunara-terracotta transition-all hover:bg-tenunara-terracotta/5"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Produk
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-destructive/10 px-5 py-3 text-sm font-bold text-destructive hover:bg-destructive/20"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            )}

            {/* ── Customer: Buy Section ── */}
            {isCustomer && !isSold && (
              <div className="rounded-2xl bg-white border border-border/50 p-5 shadow-sm">
                {/* Quantity Selector */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-tenunara-charcoal">Jumlah</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-tenunara-teal transition-colors hover:bg-tenunara-mint hover:border-tenunara-teal/30 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-tenunara-charcoal tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                      disabled={quantity >= availableStock}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-tenunara-teal transition-colors hover:bg-tenunara-mint hover:border-tenunara-teal/30 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-tenunara-teal/60">
                    Stok: {formatNumber(availableStock)} kg
                    {product.minimum_order_kg && ` • Min: ${formatNumber(product.minimum_order_kg)} kg`}
                  </span>
                  {product.minimum_order_kg && quantity < product.minimum_order_kg && (
                    <span className="text-[10px] text-grade-warning font-medium">
                      Min. {formatNumber(product.minimum_order_kg)} kg
                    </span>
                  )}
                </div>

                {/* Total Price Preview */}
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                  <span className="text-sm font-medium text-tenunara-teal">Subtotal</span>
                  <span className="text-lg font-bold text-tenunara-terracotta">{formatCurrency(totalPrice)}</span>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={showAdded || (product.minimum_order_kg ? quantity < product.minimum_order_kg : false)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-5 py-3 text-sm font-bold transition-all disabled:opacity-50",
                      showAdded
                        ? "border-grade-success bg-grade-success/10 text-grade-success"
                        : "border-tenunara-terracotta bg-white text-tenunara-terracotta hover:bg-tenunara-terracotta/5",
                    )}
                  >
                    {showAdded ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <ShoppingCart className="h-4 w-4" />
                    )}
                    {showAdded ? "Ditambahkan!" : "Keranjang"}
                  </Button>
                  <Button
                    onClick={handleOrder}
                    disabled={creating || (product.minimum_order_kg ? quantity < product.minimum_order_kg : false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-tenunara-terracotta px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-tenunara-terracotta/90 disabled:opacity-50"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    {creating ? "Memproses..." : "Beli Langsung"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Sold notice ── */}
            {isCustomer && isSold && (
              <div className="rounded-2xl bg-white border border-border/50 p-6 text-center shadow-sm">
                <AlertTriangle className="mx-auto h-8 w-8 text-tenunara-teal/30" />
                <p className="mt-2 text-sm font-semibold text-tenunara-teal">Produk ini sudah terjual</p>
                <p className="mt-1 text-xs text-tenunara-teal/60">Cari produk serupa dari UMKM lainnya</p>
              </div>
            )}

            {/* ── Trust Badges ── */}
            <div className="rounded-2xl bg-white border border-border/50 p-4">
              <div className="flex items-center gap-3 text-sm text-tenunara-teal">
                <ShieldCheck className="h-5 w-5 text-grade-success shrink-0" />
                <span>Transaksi aman dengan sistem escrow TENUNARA</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm text-tenunara-teal">
                <BadgeCheck className="h-5 w-5 text-grade-success shrink-0" />
                <span>Produk diperiksa & diverifikasi oleh AI</span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm text-tenunara-teal">
                <Scale className="h-5 w-5 text-tenunara-teal shrink-0" />
                <span>Dapatkan kepastian grade & kualitas kain</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
         MOBILE: Detail Tabs (below the two-column layout)
         ════════════════════════════════════════════════════════ */}
      <div className="mt-6 lg:hidden">
        <div className="rounded-2xl bg-white border border-border/50 shadow-sm">
          <div className="flex gap-4 overflow-x-auto border-b border-border/50 px-4 pt-4 scrollbar-none">
            <TabBtn active={activeTab === "deskripsi"} onClick={() => setActiveTab("deskripsi")}>
              Deskripsi
            </TabBtn>
            <TabBtn active={activeTab === "spesifikasi"} onClick={() => setActiveTab("spesifikasi")}>
              Spesifikasi
            </TabBtn>
            {product.defects && product.defects.length > 0 && (
              <TabBtn active={activeTab === "cacat"} onClick={() => setActiveTab("cacat")}>
                Cacat ({product.defects.length})
              </TabBtn>
            )}
            {product.ai_reasoning && (
              <TabBtn active={activeTab === "analisis"} onClick={() => setActiveTab("analisis")}>
                Analisis AI
              </TabBtn>
            )}
          </div>

          <div className="px-4 py-5">
            {/* Deskripsi Tab */}
            {activeTab === "deskripsi" && (
              <div>
                <p className="text-sm leading-relaxed text-tenunara-charcoal">
                  {product.notes && product.notes.length > 200
                    ? descExpanded ? product.notes : product.notes.slice(0, 200) + "..."
                    : product.notes || "Tidak ada deskripsi untuk produk ini."}
                </p>
                {product.notes && product.notes.length > 200 && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="mt-2 flex items-center gap-1 text-sm font-semibold text-tenunara-terracotta"
                  >
                    {descExpanded ? "Lebih Sedikit" : "Selengkapnya"}
                    {descExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>
            )}

            {/* Spesifikasi Tab */}
            {activeTab === "spesifikasi" && (
              <div className="divide-y divide-border/50">
                <InfoRow icon={Building2} label="Jenis Kain" value={product.fabric_name || "-"} />
                <InfoRow icon={Droplets} label="Kategori" value={product.fabric_category === "natural" ? "Alami" : product.fabric_category === "synthetic" ? "Sintetis" : "Campuran"} />
                <InfoRow icon={Eye} label="Warna" value={colorName} />
                <InfoRow icon={Ruler} label="Ukuran" value={AI_SIZE_RANGE_LABEL[product.ai_size_range || ""] || product.ai_size_range || "-"} />
                <InfoRow icon={Zap} label="Sumber" value={PRODUCTION_SOURCE_LABEL[product.production_source] || product.production_source} />
                <InfoRow icon={CheckCircle2} label="Kebersihan" value={HYGIENE_STATUS_LABEL[product.hygiene_status] || product.hygiene_status} color="text-grade-success" />
                <InfoRow icon={Scale} label="Berat" value={`${formatNumber(product.total_weight_kg)} kg`} />
                <InfoRow icon={Package} label="Stok" value={`${formatNumber(availableStock)} kg`} />
                {product.fiber_composition && <InfoRow icon={Droplets} label="Komposisi" value={product.fiber_composition} />}
                {product.minimum_order_kg && <InfoRow icon={Scale} label="Min. Beli" value={`${formatNumber(product.minimum_order_kg)} kg`} />}
                {product.has_odor && <InfoRow icon={AlertTriangle} label="Bau" value="Kain memiliki bau" color="text-grade-warning" />}
              </div>
            )}

            {/* Cacat Tab */}
            {activeTab === "cacat" && product.defects && (
              <div className="space-y-2">
                {product.defects.length === 0 ? (
                  <p className="text-sm text-tenunara-teal">Tidak ada cacat terdeteksi.</p>
                ) : (
                  product.defects.map((d, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-tenunara-mint/30 border border-border/50 px-4 py-3">
                      <span className="text-sm font-medium text-tenunara-charcoal">{DEFECT_TYPE_LABEL[d.defect_type] || d.defect_type}</span>
                      <span className="text-xs font-medium text-tenunara-teal">{d.defect_percentage}%</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Analisis Tab */}
            {activeTab === "analisis" && product.ai_reasoning && (
              <div className="rounded-xl bg-tenunara-mint/20 p-4">
                <div className="flex items-start gap-3">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-tenunara-terracotta" />
                  <div>
                    <p className="text-sm font-semibold text-tenunara-charcoal">Analisis AI TENUNARA</p>
                    <p className="mt-1 text-sm leading-relaxed text-tenunara-teal">{product.ai_reasoning}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
         MOBILE: Sticky Bottom Bar
         ════════════════════════════════════════════════════════ */}
      {isCustomer && !isSold && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-tenunara-terracotta">{formatCurrency(product.price_per_kg)}<span className="text-xs font-normal text-tenunara-teal"> /kg</span></p>
              <p className="text-[11px] text-tenunara-teal">{formatNumber(availableStock)} kg tersedia</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border disabled:opacity-30"
              >
                <Minus className="h-3.5 w-3.5 text-tenunara-teal" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-tenunara-charcoal tabular-nums">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                disabled={quantity >= availableStock}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border disabled:opacity-30"
              >
                <Plus className="h-3.5 w-3.5 text-tenunara-teal" />
              </button>
            </div>
            <Button
              onClick={handleOrder}
              disabled={creating || (product.minimum_order_kg ? quantity < product.minimum_order_kg : false)}
              className="flex items-center gap-2 rounded-xl bg-tenunara-terracotta px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-tenunara-terracotta/90 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Beli
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
