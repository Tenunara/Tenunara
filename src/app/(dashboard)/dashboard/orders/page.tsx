"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Package, ChevronLeft, ChevronRight, ImageOff } from "lucide-react"
import { EmptyState, ErrorState } from "@/components/shared"
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils"
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/constants"
import { fetchOrders } from "@/lib/api"
import type { OrderListItem, OrderStatus } from "@/lib/types"

const PAGE_SIZE = 10

const ORDER_TABS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending_payment", label: "Belum Bayar" },
  { key: "awaiting_shipment", label: "Dikirim" },
  { key: "in_verification", label: "Verifikasi" },
  { key: "completed", label: "Selesai" },
  { key: "dispute", label: "Sengketa" },
  { key: "cancelled", label: "Dibatalkan" },
]

function OrderSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-4 p-5">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-tenunara-teal/10" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded-lg bg-tenunara-teal/10" />
              <div className="h-3 w-2/3 animate-pulse rounded-lg bg-tenunara-teal/10" />
              <div className="h-5 w-1/4 animate-pulse rounded-lg bg-tenunara-teal/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const currentUserRole = typeof window !== "undefined" ? localStorage.getItem("sb-user-role") || "" : ""
  const isUmkm = currentUserRole === "umkm"

  // Filter tabs by role: hide "pending_payment" for UMKM
  const visibleTabs = isUmkm
    ? ORDER_TABS.filter((t) => t.key !== "pending_payment")
    : ORDER_TABS

  const loadOrders = useCallback(() => {
    setLoading(true)
    setError(null)

    fetchOrders({
      page,
      limit: PAGE_SIZE,
      status: activeTab === "all" ? undefined : activeTab,
    })
      .then((res) => {
        setOrders(res.data || [])
        setTotal(res.total || 0)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [page, activeTab])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return
      setPage(newPage)
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    [totalPages],
  )

  const title = isUmkm ? "Pesanan Masuk" : "Pesanan Saya"
  const description = isUmkm
    ? "Daftar pesanan dari pengrajin"
    : "Pesanan kain yang kamu buat"

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-tenunara-charcoal">{title}</h1>
        <p className="mt-1 text-sm text-tenunara-teal">{description}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-tenunara-mint/50 p-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              setPage(1)
            }}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              activeTab === tab.key
                ? "bg-white font-semibold text-tenunara-charcoal shadow-sm"
                : "text-tenunara-teal hover:text-tenunara-charcoal",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <OrderSkeleton />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setPage(1)
          }}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-12 w-12" />}
          title="Belum ada pesanan"
          description={
            activeTab === "all"
              ? isUmkm
                ? "Belum ada pengrajin yang memesan produk kamu"
                : "Kamu belum membuat pesanan apapun"
              : `Tidak ada pesanan dengan status "${ORDER_STATUS_LABEL[activeTab] || activeTab}"`
          }
          actionLabel={!isUmkm && activeTab === "all" ? "Cari Material" : undefined}
          onAction={!isUmkm && activeTab === "all" ? () => router.push("/dashboard/browse") : undefined}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-tenunara-teal">
            Menampilkan {orders.length} dari {total} pesanan
          </p>

          <div className="space-y-4">
            {orders.map((order) => {
              const statusKey = order.status as OrderStatus
              const displayName = isUmkm
                ? order.pengrajin_name
                : order.umkm_name

              return (
                <button
                  key={order.id}
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  className="w-full overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-4 p-5">
                    {/* Product thumbnail */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-tenunara-mint">
                      {order.first_product_image ? (
                        <img
                          src={order.first_product_image}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none"
                            ;(e.target as HTMLImageElement).parentElement!.classList.add("flex", "items-center", "justify-center")
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-6 w-6 text-tenunara-teal/30" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-tenunara-charcoal">
                          {order.order_number}
                        </span>
                        <span
                          className={cn(
                            "inline-block shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            ORDER_STATUS_COLOR[statusKey] || "bg-tenunara-teal/10 text-tenunara-teal",
                          )}
                        >
                          {ORDER_STATUS_LABEL[statusKey] || statusKey}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-tenunara-teal">
                        <span>{order.items_count} item</span>
                        <span>{formatNumber(order.total_weight_kg)} kg</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-tenunara-terracotta">
                          {formatCurrency(order.grand_total)}
                        </span>
                        {displayName && (
                          <span className="text-xs text-tenunara-teal/70">
                            {displayName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-tenunara-teal/40" />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-tenunara-teal transition-colors hover:bg-tenunara-mint/50 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors",
                    p === page
                      ? "bg-tenunara-terracotta text-white"
                      : "border border-border text-tenunara-teal hover:bg-tenunara-mint/50",
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-tenunara-teal transition-colors hover:bg-tenunara-mint/50 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
