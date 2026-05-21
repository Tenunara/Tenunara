"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Package } from "lucide-react"
import { ListingCard } from "@/components/listing/listing-card"
import { SearchBar } from "@/components/search/search-bar"
import { SearchFilters, type FilterState } from "@/components/search/search-filters"
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/shared"
import type { ListingWithSeller } from "@/lib/types"

const defaultFilters: FilterState = {
  material: null,
  grade: null,
  minPricePerKg: null,
  maxPricePerKg: null,
  minQuantityKg: null,
}

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

export default function BrowsePage() {
  const router = useRouter()
  const [listings, setListings] = useState<ListingWithSeller[]>([])
  const [filtered, setFiltered] = useState<ListingWithSeller[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  useEffect(() => {
    fetch("/data/temp_data_listings.json")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data")
        return res.json()
      })
      .then((json) => {
        const data = json.data as ListingWithSeller[]
        setListings(data)
        setFiltered(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const applyFilters = useCallback(
    (items: ListingWithSeller[], f: FilterState) => {
      return items.filter((item) => {
        if (f.material && item.material !== f.material) return false
        if (f.grade && item.grade !== f.grade) return false
        if (f.minPricePerKg !== null && item.price_per_kg < f.minPricePerKg) return false
        if (f.maxPricePerKg !== null && item.price_per_kg > f.maxPricePerKg) return false
        if (f.minQuantityKg !== null && item.quantity_kg < f.minQuantityKg) return false
        return item.status === "active"
      })
    },
    [],
  )

  useEffect(() => {
    setFiltered(applyFilters(listings, filters))
  }, [listings, filters, applyFilters])

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader onSearch={handleSearch} />
        <div className="mt-4">
          <SearchFilters filters={filters} onChange={setFilters} />
        </div>
        <div className="mt-6">
          <ListingSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader onSearch={handleSearch} />
        <div className="mt-8">
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader onSearch={handleSearch} />

      <div className="mt-4">
        <SearchFilters filters={filters} onChange={setFilters} />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title="Tidak ada material tersedia"
            description="Belum ada seller yang mempublikasikan listing dengan kriteria ini"
          />
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-tenunara-teal">
            Menampilkan {filtered.length} material tersedia
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                variant="grid"
                onClick={(id) => router.push(`/dashboard/listings/${id}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PageHeader({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-tenunara-charcoal">Cari Material</h1>
      <p className="mt-1 text-sm text-tenunara-teal">
        Temukan limbah kain yang sesuai kebutuhan Anda
      </p>
      <div className="mt-4">
        <SearchBar onSearch={onSearch} />
      </div>
    </div>
  )
}
