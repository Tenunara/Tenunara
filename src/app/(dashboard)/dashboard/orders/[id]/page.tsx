"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Package,
  Store,
  User,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Truck,
  ShieldCheck,
  Scale,
  Info,
  Wallet,
  QrCode,
  Landmark,
  Building2,
  MapPin,
  Send,
  Zap,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"
import { ErrorState, ConfirmDialog } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatCurrency, formatDate, formatRelativeTime, formatNumber } from "@/lib/utils"
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_COLOR,
  ORDER_DISPUTE_REASON_LABEL,
  ORDER_DISPUTE_STATUS_LABEL,
  RESOLUTION_TYPE_LABEL,
  ORDER_STATUS_FLOW,
  GRADE_BG,
  SHIPPING_OPTIONS,
  PAYMENT_METHODS,
} from "@/lib/constants"
import {
  fetchOrderById,
  payOrder,
  confirmShipment,
  confirmReceipt,
  cancelOrder,
  submitDispute,
  resolveDispute,
} from "@/lib/api"
import type {
  OrderWithDetails,
  OrderStatus,
  OrderItemWithProduct,
  OrderStatusHistory,
  OrderDisputeRow,
  OrderDisputeReason,
} from "@/lib/types"

// ─── Helpers ─────────────────────────────────────────────────

function getStatusIndex(status: string): number {
  const idx = ORDER_STATUS_FLOW.indexOf(status)
  return idx >= 0 ? idx : -1
}

function parseOrderNotes(notes: string | null): { meta: string | null; cleanNotes: string | null } {
  if (!notes) return { meta: null, cleanNotes: null }
  const metaMatch = notes.match(/^===(.*?)===\n?/)
  if (metaMatch) {
    return {
      meta: metaMatch[1],
      cleanNotes: notes.slice(metaMatch[0].length).trim() || null,
    }
  }
  return { meta: null, cleanNotes: notes }
}

type OptionMeta = { description: string; Icon: LucideIcon }

const SHIPPING_OPTION_META: Record<string, OptionMeta> = {
  jne: { description: "Layanan reguler nasional dengan jaringan luas.", Icon: Truck },
  jnt: { description: "Kurir ekspres dengan jangkauan luas.", Icon: Send },
  sicepat: { description: "Pengiriman cepat untuk kebutuhan harian.", Icon: Zap },
  anteraja: { description: "Pilihan kurir nasional untuk pengiriman aman.", Icon: MapPin },
  ninja_xpress: { description: "Kurir e-commerce andalan untuk paket Anda.", Icon: Package },
}

const PAYMENT_METHOD_META: Record<string, OptionMeta> = {
  ewallet: { description: "DANA, GoPay, OVO, ShopeePay, LinkAja.", Icon: Wallet },
  qris: {
    description: "QR nasional untuk bayar sekali scan dari aplikasi apa pun.",
    Icon: QrCode,
  },
  virtual_account: {
    description: "Nomor rekening unik untuk transfer otomatis.",
    Icon: Landmark,
  },
  transfer_bank: {
    description: "Mobile/Internet Banking (BCA, Mandiri, BNI, BRI).",
    Icon: Building2,
  },
}

// ─── Skeleton ────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="h-5 w-24 animate-pulse rounded-lg bg-tenunara-teal/10" />
      <div className="mt-6 space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-tenunara-teal/10" />
        <div className="h-48 animate-pulse rounded-2xl bg-tenunara-teal/10" />
        <div className="h-32 animate-pulse rounded-2xl bg-tenunara-teal/10" />
      </div>
    </div>
  )
}

// ─── Status Timeline ─────────────────────────────────────────

function OrderTimeline({ status }: { status: string }) {
  const currentIdx = getStatusIndex(status)
  const isCancelled = status === "cancelled"
  const isDispute = status === "dispute"

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-tenunara-teal">
        Status Pesanan
      </h3>
      <div className="relative flex items-start justify-between">
        {/* Connector line */}
        <div className="absolute left-[13px] top-3 h-[calc(100%-24px)] w-0.5 bg-tenunara-mint" />
        <div
          className="absolute left-[13px] top-3 w-0.5 bg-tenunara-terracotta transition-all duration-500"
          style={{ height: currentIdx >= 0 ? `${(currentIdx / (ORDER_STATUS_FLOW.length - 1)) * 100}%` : "0%" }}
        />

        {ORDER_STATUS_FLOW.map((step, i) => {
          const stepLabel = ORDER_STATUS_LABEL[step] || step
          const isCompleted = currentIdx > i
          const isCurrent = currentIdx === i

          return (
            <div key={step} className="relative flex flex-col items-center">
              <div
                className={cn(
                  "relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full text-xs font-bold transition-all",
                  isCompleted
                    ? "bg-tenunara-terracotta text-white"
                    : isCurrent
                      ? "border-2 border-tenunara-terracotta bg-white text-tenunara-terracotta"
                      : "border-2 border-tenunara-teal/20 bg-white text-tenunara-teal/30",
                )}
              >
                {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <p
                className={cn(
                  "mt-2 whitespace-nowrap text-[11px] font-medium",
                  isCompleted || isCurrent ? "text-tenunara-charcoal" : "text-tenunara-teal/40",
                )}
              >
                {stepLabel}
              </p>
            </div>
          )
        })}

        {/* Dispute / Cancelled overlay indicator */}
        {isDispute && (
          <div className="absolute -bottom-8 left-0 right-0 text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              <Scale className="h-3 w-3" /> Sengketa
            </span>
          </div>
        )}
        {isCancelled && (
          <div className="absolute -bottom-8 left-0 right-0 text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-tenunara-teal/10 px-3 py-1 text-xs font-semibold text-tenunara-teal">
              <Ban className="h-3 w-3" /> Dibatalkan
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Order Item Row ──────────────────────────────────────────

function OrderItemCard({ item }: { item: OrderItemWithProduct }) {
  const images = item.product?.images_url || []
  const imgSrc = images[0]
  const [imgError, setImgError] = useState(false)
  const grade = item.product?.final_grade || "B"

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border p-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-tenunara-mint">
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-6 w-6 text-tenunara-teal/30" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-tenunara-charcoal">
            {item.product?.fabric_name || "Kain"}
          </p>
          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", GRADE_BG[grade as keyof typeof GRADE_BG] || "bg-tenunara-teal/10 text-tenunara-teal")}>
            {grade}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-tenunara-teal">
          {formatNumber(item.quantity_kg)} kg × {formatCurrency(item.price_per_kg)}
        </p>
        <p className="mt-1 text-sm font-bold text-tenunara-terracotta">
          {formatCurrency(item.subtotal)}
        </p>
      </div>
    </div>
  )
}

// ─── Price Breakdown ─────────────────────────────────────────

function PricingSummary({ order }: { order: OrderWithDetails }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tenunara-teal">
        Rincian Harga
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-tenunara-teal">
          <span>Subtotal</span>
          <span className="text-tenunara-charcoal">{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-tenunara-teal">
          <span>Ongkos Kirim</span>
          <span className="text-tenunara-charcoal">{formatCurrency(order.shipping_cost)}</span>
        </div>
        <div className="flex justify-between text-tenunara-teal">
          <span>Biaya Aplikasi (2.5%)</span>
          <span className="text-tenunara-charcoal">{formatCurrency(order.app_fee)}</span>
        </div>
        <div className="border-t border-border pt-2">
          <div className="flex justify-between font-bold text-tenunara-charcoal">
            <span>Total</span>
            <span className="text-tenunara-terracotta">{formatCurrency(order.grand_total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Party Card ──────────────────────────────────────────────

function PartyCard({
  role,
  name,
  storeName,
  email,
  phone,
  city,
  district,
  address,
  photoUrl,
}: {
  role: "pengrajin" | "umkm"
  name: string
  storeName?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  district?: string | null
  address?: string | null
  photoUrl?: string | null
}) {
  const isUmkm = role === "umkm"
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          isUmkm ? "bg-tenunara-terracotta/10 text-tenunara-terracotta" : "bg-blue-100 text-blue-600",
        )}>
          {isUmkm ? <Store className="h-5 w-5" /> : <User className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-tenunara-charcoal">{name}</p>
          {storeName && <p className="text-xs text-tenunara-teal">{storeName}</p>}
        </div>
      </div>
      {(email || phone) && (
        <div className="mt-3 space-y-1 text-xs text-tenunara-teal">
          {email && <p>📧 {email}</p>}
          {phone && <p>📞 {phone}</p>}
        </div>
      )}
      {(city || address) && (
        <div className="mt-2 rounded-xl bg-tenunara-mint/30 px-3 py-2">
          <p className="text-xs text-tenunara-charcoal">
            {[address, city, district].filter(Boolean).join(", ") || "Alamat tidak tersedia"}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Status History ──────────────────────────────────────────

function StatusHistorySection({ history }: { history: OrderStatusHistory[] }) {
  if (!history || history.length === 0) return null

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tenunara-teal">
        Riwayat Status
      </h3>
      <div className="space-y-3">
        {history.map((h) => (
          <div key={h.id} className="flex items-start gap-3">
            <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-tenunara-terracotta" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-tenunara-charcoal">
                {ORDER_STATUS_LABEL[h.to_status] || h.to_status}
              </p>
              <p className="text-xs text-tenunara-teal">
                {formatRelativeTime(h.created_at)}
                {h.notes && ` — ${h.notes}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dispute Section ─────────────────────────────────────────

function DisputeSection({ dispute }: { dispute: OrderDisputeRow }) {
  const [expanded, setExpanded] = useState(false)
  const images = dispute.image_urls || []

  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-destructive" />
          <span className="font-semibold text-destructive">Komplain</span>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            dispute.status === "open"
              ? "bg-grade-warning/10 text-grade-warning"
              : "bg-grade-success/10 text-grade-success",
          )}>
            {ORDER_DISPUTE_STATUS_LABEL[dispute.status] || dispute.status}
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-destructive/60 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-tenunara-teal">Alasan</p>
            <p className="text-sm text-tenunara-charcoal">
              {ORDER_DISPUTE_REASON_LABEL[dispute.dispute_reason] || dispute.dispute_reason}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-tenunara-teal">Deskripsi</p>
            <p className="text-sm text-tenunara-charcoal">{dispute.description}</p>
          </div>
          {images.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-tenunara-teal">Lampiran</p>
              <div className="flex gap-2 overflow-x-auto">
                {images.map((url, i) => (
                  <img key={i} src={url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                ))}
              </div>
            </div>
          )}
          {dispute.resolution && (
            <div className="rounded-xl bg-white p-3">
              <p className="text-xs font-semibold text-tenunara-teal">Resolusi</p>
              <p className="text-sm text-tenunara-charcoal">{dispute.resolution}</p>
              {dispute.resolution_type && (
                <p className="mt-1 text-xs text-tenunara-teal">
                  Tipe: {RESOLUTION_TYPE_LABEL[dispute.resolution_type] || dispute.resolution_type}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Cancel dialog
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  // Shipping / payment options (selected during pay)
  const [shippingOption, setShippingOption] = useState(
    SHIPPING_OPTIONS[0]?.value || "jne",
  )
  const [paymentMethod, setPaymentMethod] = useState(
    PAYMENT_METHODS[0]?.value || "ewallet",
  )

  // Dispute form
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeReason, setDisputeReason] = useState<OrderDisputeReason | "">("")
  const [disputeDesc, setDisputeDesc] = useState("")

  // Resolve dispute form
  const [showResolveForm, setShowResolveForm] = useState(false)
  const [resolutionText, setResolutionText] = useState("")
  const [resolutionAction, setResolutionAction] = useState<"complete" | "cancel" | "">("")

  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("sb-user-id") || "" : ""
  const currentUserRole = (typeof window !== "undefined" ? localStorage.getItem("sb-user-role") : "") as string
  const isUmkm = currentUserRole === "umkm"

  const refreshOrder = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchOrderById(id)
      .then((data) => {
        setOrder(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    const token = localStorage.getItem("sb-access-token")
    if (!token) {
      router.push("/login")
      return
    }
    refreshOrder()
  }, [id, router, refreshOrder])

  // ── Actions ──

  const handlePay = useCallback(async () => {
    setActionLoading("pay")
    try {
      await payOrder(id, shippingOption, paymentMethod)
      refreshOrder()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }, [id, shippingOption, paymentMethod, refreshOrder])

  const handleConfirmReceipt = useCallback(async () => {
    setActionLoading("confirm-receipt")
    try {
      await confirmReceipt(id)
      refreshOrder()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }, [id, refreshOrder])

  const handleConfirmShipment = useCallback(async () => {
    setActionLoading("confirm-shipment")
    try {
      await confirmShipment(id)
      refreshOrder()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }, [id, refreshOrder])

  const handleCancel = useCallback(async () => {
    setActionLoading("cancel")
    try {
      await cancelOrder(id, cancelReason)
      setCancelOpen(false)
      setCancelReason("")
      refreshOrder()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }, [id, cancelReason, refreshOrder])

  const handleSubmitDispute = useCallback(async () => {
    if (!disputeReason || !disputeDesc) return
    setActionLoading("dispute")
    try {
      await submitDispute(id, {
        dispute_reason: disputeReason as OrderDisputeReason,
        description: disputeDesc,
      })
      setShowDisputeForm(false)
      refreshOrder()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }, [id, disputeReason, disputeDesc, refreshOrder])

  const handleResolveDispute = useCallback(async () => {
    if (!resolutionText || !resolutionAction) return
    setActionLoading("resolve")
    try {
      await resolveDispute(id, {
        resolution: resolutionText,
        resolution_type: resolutionAction === "cancel" ? "refund" : "other",
        action: resolutionAction as "complete" | "cancel",
      })
      setShowResolveForm(false)
      setResolutionText("")
      setResolutionAction("")
      refreshOrder()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }, [id, resolutionText, resolutionAction, refreshOrder])

  // ── Render ──

  if (loading) return <Skeleton />

  if (error) {
    return (
      <div className="mx-auto max-w-4xl pt-8">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl pt-8">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-12 text-center shadow-sm">
          <Package className="h-12 w-12 text-tenunara-teal/30" />
          <div>
            <p className="font-semibold text-tenunara-charcoal">Pesanan tidak ditemukan</p>
            <p className="mt-1 text-sm text-tenunara-teal">Pesanan yang Anda cari tidak tersedia.</p>
          </div>
          <Button onClick={() => router.push("/dashboard/orders")} className="rounded-xl bg-tenunara-terracotta px-6 py-2 text-sm font-semibold text-white hover:bg-tenunara-terracotta/90">
            Kembali
          </Button>
        </div>
      </div>
    )
  }

  const status = order.status
  const statusKey = status as OrderStatus
  const canCancel =
    (isUmkm && (status === "pending_payment" || status === "awaiting_shipment")) ||
    (!isUmkm && status === "pending_payment")
  const canPay = !isUmkm && status === "pending_payment"
  const canConfirmShipment = isUmkm && status === "awaiting_shipment"
  const canConfirmReceipt = !isUmkm && status === "in_verification"
  const canDispute = !isUmkm && status === "in_verification"
  const { meta: orderMeta, cleanNotes } = parseOrderNotes(order.notes)
  const selectedShippingCost = SHIPPING_OPTIONS.find(o => o.value === shippingOption)?.cost || 12000

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/orders")}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-tenunara-teal transition-colors hover:text-tenunara-charcoal"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-tenunara-charcoal">
              {order.order_number}
            </h1>
            <span className={cn(
              "shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold",
              ORDER_STATUS_COLOR[statusKey] || "bg-tenunara-teal/10 text-tenunara-teal",
            )}>
              {ORDER_STATUS_LABEL[statusKey] || status}
            </span>
          </div>
          <p className="mt-1 text-xs text-tenunara-teal">
            Dibuat {formatDate(order.created_at)}
            {order.payment_simulated_at && ` · Dibayar ${formatDate(order.payment_simulated_at)}`}
            {order.completed_at && ` · Selesai ${formatDate(order.completed_at)}`}
            {order.cancelled_at && ` · Dibatalkan ${formatDate(order.cancelled_at)}`}
          </p>
          {order.cancellation_reason && (
            <p className="mt-1 text-xs text-destructive">
              Alasan: {order.cancellation_reason}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Timeline */}
        <OrderTimeline status={status} />

        {/* Action buttons */}
        {/* Pay — choose shipping + payment, then pay */}
        {canPay && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-tenunara-charcoal">Selesaikan Pembayaran</h3>
            <p className="mb-4 text-xs text-tenunara-teal">Pilih opsi pengiriman dan pembayaran sebelum melanjutkan</p>

            <div className="space-y-4">
              {/* Shipping option */}
              <div>
                <Label id="shipping-label">Opsi Pengiriman</Label>
                <div role="radiogroup" aria-labelledby="shipping-label" className="mt-2 space-y-2">
                  {SHIPPING_OPTIONS.map((opt) => {
                    const meta = SHIPPING_OPTION_META[opt.value] || {
                      description: "",
                      Icon: Truck,
                    }
                    const Icon = meta.Icon
                    const active = shippingOption === opt.value

                    return (
                      <label
                        key={opt.value}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                          active
                            ? "border-tenunara-terracotta bg-tenunara-mint/30"
                            : "border-border bg-white hover:bg-tenunara-mint/10",
                        )}
                      >
                        <input
                          type="radio"
                          id={`shipping-${opt.value}`}
                          name="shipping"
                          value={opt.value}
                          checked={active}
                          onChange={(e) => setShippingOption(e.target.value)}
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            active
                              ? "bg-tenunara-terracotta/10 text-tenunara-terracotta"
                              : "bg-tenunara-mint/40 text-tenunara-teal",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-tenunara-charcoal">
                            {opt.label}
                          </span>
                          {meta.description && (
                            <span className="block text-xs text-tenunara-teal">
                              {meta.description}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-tenunara-charcoal">
                            {formatCurrency(opt.cost)}
                          </span>
                          <span
                            className={cn(
                              "h-4 w-4 rounded-full border",
                              active
                                ? "border-tenunara-terracotta bg-tenunara-terracotta"
                                : "border-border",
                            )}
                          />
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Payment method */}
              <div>
                <Label id="payment-label">Metode Pembayaran</Label>
                <div role="radiogroup" aria-labelledby="payment-label" className="mt-2 space-y-2">
                  {PAYMENT_METHODS.map((method) => {
                    const meta = PAYMENT_METHOD_META[method.value] || {
                      description: "",
                      Icon: Wallet,
                    }
                    const Icon = meta.Icon
                    const active = paymentMethod === method.value

                    return (
                      <label
                        key={method.value}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                          active
                            ? "border-tenunara-terracotta bg-tenunara-mint/30"
                            : "border-border bg-white hover:bg-tenunara-mint/10",
                        )}
                      >
                        <input
                          type="radio"
                          id={`payment-${method.value}`}
                          name="payment"
                          value={method.value}
                          checked={active}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            active
                              ? "bg-tenunara-terracotta/10 text-tenunara-terracotta"
                              : "bg-tenunara-mint/40 text-tenunara-teal",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-tenunara-charcoal">
                            {method.label}
                          </span>
                          {meta.description && (
                            <span className="block text-xs text-tenunara-teal">
                              {meta.description}
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            "h-4 w-4 rounded-full border",
                            active
                              ? "border-tenunara-terracotta bg-tenunara-terracotta"
                              : "border-border",
                          )}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Price preview */}
              <div className="rounded-xl bg-tenunara-mint/30 p-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-tenunara-teal">
                    <span>Subtotal</span>
                    <span className="text-tenunara-charcoal">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-tenunara-teal">
                    <span>Ongkos Kirim</span>
                    <span className="text-tenunara-charcoal">{formatCurrency(selectedShippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-tenunara-teal">
                    <span>Biaya Aplikasi (2.5%)</span>
                    <span className="text-tenunara-charcoal">{formatCurrency(order.app_fee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 font-bold text-tenunara-charcoal">
                    <span>Total</span>
                    <span className="text-tenunara-terracotta">
                      {formatCurrency(order.subtotal + selectedShippingCost + order.app_fee)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pay button */}
              <Button
                onClick={handlePay}
                disabled={actionLoading === "pay"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-tenunara-terracotta px-5 py-3 text-sm font-semibold text-white hover:bg-tenunara-terracotta/90 disabled:opacity-50"
              >
                {actionLoading === "pay"
                  ? "Memproses..."
                  : `Bayar ${formatCurrency(order.subtotal + selectedShippingCost + order.app_fee)}`}
              </Button>
            </div>
          </div>
        )}

        {/* Confirm Shipment (UMKM) — one-click status update */}
        {canConfirmShipment && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Truck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-tenunara-charcoal">Konfirmasi Pengiriman</p>
                <p className="text-xs text-tenunara-teal">Konfirmasi bahwa barang sudah dikirim ke pengrajin</p>
              </div>
              <Button
                onClick={handleConfirmShipment}
                disabled={actionLoading === "confirm-shipment"}
                className="shrink-0 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === "confirm-shipment" ? "Memproses..." : "Barang dalam Perjalanan"}
              </Button>
            </div>
          </div>
        )}

        {/* Confirm Receipt (pengrajin) */}
        {canConfirmReceipt && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-grade-success/10 text-grade-success">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-tenunara-charcoal">Konfirmasi Penerimaan</p>
                <p className="text-xs text-tenunara-teal">Konfirmasi bahwa barang sudah diterima dan sesuai</p>
              </div>
              <Button
                onClick={handleConfirmReceipt}
                disabled={actionLoading === "confirm-receipt"}
                className="shrink-0 rounded-xl bg-grade-success px-5 py-2 text-sm font-semibold text-white hover:bg-grade-success/90 disabled:opacity-50"
              >
                {actionLoading === "confirm-receipt" ? "Memproses..." : "Terima Barang"}
              </Button>
            </div>
          </div>
        )}

        {/* Dispute form (pengrajin) */}
        {canDispute && !showDisputeForm && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-tenunara-charcoal">Tidak Sesuai?</p>
                <p className="text-xs text-tenunara-teal">Ajukan komplain jika barang tidak sesuai dengan pesanan</p>
              </div>
              <Button
                onClick={() => setShowDisputeForm(true)}
                variant="outline"
                className="shrink-0 rounded-xl border-destructive/30 px-5 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5"
              >
                Ajukan Komplain
              </Button>
            </div>
          </div>
        )}

        {showDisputeForm && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-tenunara-charcoal">Form Komplain</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="dispute-reason">Alasan Komplain</Label>
                <select
                  id="dispute-reason"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value as OrderDisputeReason)}
                  className="mt-1 block w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-tenunara-charcoal focus:border-tenunara-terracotta focus:outline-none"
                >
                  <option value="">Pilih alasan...</option>
                  <option value="quality_not_match">Kualitas Tidak Sesuai</option>
                  <option value="grade_different">Grade Berbeda</option>
                  <option value="wrong_material">Bahan Salah</option>
                  <option value="damaged">Rusak</option>
                  <option value="quantity_insufficient">Jumlah Kurang</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div>
                <Label htmlFor="dispute-desc">Deskripsi</Label>
                <Textarea
                  id="dispute-desc"
                  placeholder="Jelaskan masalah yang kamu alami (min. 10 karakter)"
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitDispute}
                  disabled={!disputeReason || disputeDesc.length < 10 || actionLoading === "dispute"}
                  className="flex-1 rounded-xl bg-destructive px-5 py-2 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
                >
                  {actionLoading === "dispute" ? "Memproses..." : "Kirim Komplain"}
                </Button>
                <Button
                  onClick={() => setShowDisputeForm(false)}
                  variant="outline"
                  className="rounded-xl px-5 py-2 text-sm"
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel button */}
        {canCancel && (
          <button
            onClick={() => setCancelOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
          >
            <Ban className="h-4 w-4" />
            Batalkan Pesanan
          </button>
        )}

        {/* Resolve Dispute (UMKM) */}
        {isUmkm && status === "dispute" && !showResolveForm && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Scale className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-tenunara-charcoal">Selesaikan Komplain</p>
                <p className="text-xs text-tenunara-teal">Tanggapi komplain dari pengrajin</p>
              </div>
              <Button
                onClick={() => setShowResolveForm(true)}
                className="shrink-0 rounded-xl bg-destructive px-5 py-2 text-sm font-semibold text-white hover:bg-destructive/90"
              >
                Selesaikan
              </Button>
            </div>
          </div>
        )}

        {showResolveForm && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-tenunara-charcoal">Form Penyelesaian Komplain</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="resolution-action">Tindakan</Label>
                <select
                  id="resolution-action"
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value as "complete" | "cancel")}
                  className="mt-1 block w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-tenunara-charcoal focus:border-tenunara-terracotta focus:outline-none"
                >
                  <option value="">Pilih tindakan...</option>
                  <option value="complete">Selesaikan (dana escrow ke UMKM)</option>
                  <option value="cancel">Batalkan Pesanan (dana refund ke pengrajin)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="resolution-desc">Penjelasan Resolusi</Label>
                <Textarea
                  id="resolution-desc"
                  placeholder="Jelaskan bagaimana komplain ini diselesaikan"
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleResolveDispute}
                  disabled={!resolutionText || !resolutionAction || actionLoading === "resolve"}
                  className="flex-1 rounded-xl bg-destructive px-5 py-2 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
                >
                  {actionLoading === "resolve" ? "Memproses..." : "Selesaikan Komplain"}
                </Button>
                <Button
                  onClick={() => setShowResolveForm(false)}
                  variant="outline"
                  className="rounded-xl px-5 py-2 text-sm"
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Dispute section (if dispute exists) */}
        {order.dispute && (
          <DisputeSection dispute={order.dispute} />
        )}

        {/* Items */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-tenunara-teal">
            Item Pesanan
          </h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <OrderItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Pricing */}
        <PricingSummary order={order} />

        {/* Parties */}
        <div className="grid gap-4 sm:grid-cols-2">
          <PartyCard
            role="umkm"
            name={order.umkm?.nama_penjual || "UMKM"}
            storeName={order.umkm?.nama_toko}
            email={order.umkm?.email}
            phone={order.umkm?.nomor_telepon}
            city={order.umkm?.kota}
            district={order.umkm?.kabupaten}
            address={order.umkm?.alamat}
            photoUrl={order.umkm?.foto_profil_url}
          />
          <PartyCard
            role="pengrajin"
            name={order.pengrajin?.nama || "Pengrajin"}
            email={order.pengrajin?.email}
            phone={order.pengrajin?.nomor_telepon}
            city={order.pengrajin?.kota}
            district={order.pengrajin?.kabupaten}
            address={order.pengrajin?.alamat}
            photoUrl={order.pengrajin?.foto_profil_url}
          />
        </div>

        {/* Status History */}
        {order.status_history && order.status_history.length > 0 && (
          <StatusHistorySection history={order.status_history} />
        )}

        {/* Notes */}
        {order.notes && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-tenunara-teal">Catatan</h3>
            {/* Shipping / payment meta info */}
            {orderMeta && (
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-tenunara-mint/30 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-tenunara-terracotta" />
                <div className="text-sm text-tenunara-charcoal">
                  {orderMeta.split(" | ").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}
            {cleanNotes && (
              <p className="text-sm leading-relaxed text-tenunara-charcoal">{cleanNotes}</p>
            )}
            {!cleanNotes && !orderMeta && (
              <p className="text-sm leading-relaxed text-tenunara-charcoal">{order.notes}</p>
            )}
          </div>
        )}

        {/* Tracking info */}
        {order.courier_name && (
          <div className="rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-tenunara-teal" />
              <span className="text-sm font-medium text-tenunara-charcoal">{order.courier_name}</span>
              {order.tracking_number && (
                <span className="text-sm text-tenunara-teal">· {order.tracking_number}</span>
              )}
            </div>
          </div>
        )}

        {/* Completed timestamps */}
        {(order.confirmed_by_seller_at || order.confirmed_by_buyer_at || order.escrow_release_at) && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-tenunara-teal">Detail Waktu</h3>
            <div className="space-y-1 text-xs text-tenunara-teal">
              {order.confirmed_by_seller_at && <p>Dikirim: {formatDate(order.confirmed_by_seller_at)}</p>}
              {order.confirmed_by_buyer_at && <p>Diterima: {formatDate(order.confirmed_by_buyer_at)}</p>}
              {order.escrow_release_at && <p>Escrow dirilis: {formatDate(order.escrow_release_at)}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Batalkan Pesanan"
        description="Apakah Anda yakin ingin membatalkan pesanan ini?"
        confirmLabel={actionLoading === "cancel" ? "Memproses..." : "Ya, Batalkan"}
        cancelLabel="Tidak"
        variant="destructive"
        loading={actionLoading === "cancel"}
        onConfirm={handleCancel}
      >
        <div className="mt-3">
          <Label htmlFor="cancel-reason">Alasan Pembatalan (opsional)</Label>
          <Textarea
            id="cancel-reason"
            placeholder="Mengapa pesanan dibatalkan?"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            className="mt-1"
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
