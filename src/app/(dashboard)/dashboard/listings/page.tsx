"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Package } from "lucide-react"
import { ListingCard } from "@/components/listing/listing-card"
import { EmptyState, ErrorState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { fetchMyProducts } from "@/lib/api"
import type { ListingWithSeller, ListingStatus } from "@/lib/types"

const TABS: { key: ListingStatus | "all"; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "active", label: "Aktif" },
  { key: "sold", label: "Terjual" },
  { key: "archived", label: "Arsip" },
]

function ListingSkeleton() {
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

export default function MyListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<ListingWithSeller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ListingStatus | "all">("all")

  // TODO: Replace mock fetch with real API call:
  // GET /api/listings?seller_id={userId}
  useEffect(() => {
    const umkmId = localStorage.getItem("sb-user-id") || ""

    fetchMyProducts(umkmId)
      .then((products) => {
        setListings(products)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const filtered =
    activeTab === "all"
      ? listings
      : listings.filter((l) => l.status === activeTab)

  if (loading) {
    return (
      <div>
        <PageHeader />
        <ListingSkeleton />
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

  if (listings.length === 0) {
    return (
      <div>
        <PageHeader />
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Belum ada listing"
          description="Mulai dengan mengupload foto limbah kain"
          actionLabel="Upload Pertama"
          onAction={() => router.push("/dashboard/listings/new")}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader onAdd={() => router.push("/dashboard/listings/new")} />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-tenunara-mint/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-white font-semibold text-tenunara-charcoal shadow-sm"
                : "text-tenunara-teal hover:text-tenunara-charcoal"
            }`}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1.5 text-xs opacity-60">
                ({listings.filter((l) => l.status === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Tidak ada listing"
          description={
            activeTab === "active"
              ? "Belum ada listing aktif"
              : activeTab === "sold"
                ? "Belum ada listing terjual"
                : "Belum ada listing di arsip"
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              variant="grid"
              onClick={(id) => router.push(`/dashboard/listings/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PageHeader({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-tenunara-charcoal">Listing Saya</h1>
      {onAdd && (
        <Button
          onClick={onAdd}
          className="flex items-center gap-2 rounded-xl bg-tenunara-terracotta px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-tenunara-terracotta/90"
        >
          <Plus className="h-4 w-4" />
          Tambah Listing
        </Button>
      )}
    </div>
  )
}
