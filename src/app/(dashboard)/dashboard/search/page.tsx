"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Package, Loader2 } from "lucide-react"
import { ListingCard } from "@/components/listing/listing-card"
import { SearchBar } from "@/components/search/search-bar"
import { SearchFilters, type FilterState } from "@/components/search/search-filters"
import { ErrorState } from "@/components/shared"
import { cn } from "@/lib/utils"
import type { SearchResultItem } from "@/lib/types"

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
      {Array.from({ length: 3 }).map((_, i) => (
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

function SearchResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  // TODO: Replace mock search with real API call:
  // POST /api/search with { query, filters }
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    fetch("/data/temp_data_search_results.json")
      .then((res) => {
        if (!res.ok) throw new Error("Pencarian gagal")
        return res.json()
      })
      .then((json) => {
        setResults(json.data as SearchResultItem[])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [query])

  // Apply client-side filters
  const filtered = results.filter((item) => {
    if (filters.material && item.material !== filters.material) return false
    if (filters.grade && item.grade !== filters.grade) return false
    if (filters.minPricePerKg !== null && item.price_per_kg < filters.minPricePerKg) return false
    if (filters.maxPricePerKg !== null && item.price_per_kg > filters.maxPricePerKg) return false
    if (filters.minQuantityKg !== null && item.quantity_kg < filters.minQuantityKg) return false
    return true
  })

  const handleSearch = (q: string) => {
    if (q.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(q.trim())}`)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-tenunara-charcoal">Cari Material</h1>
      <p className="mt-1 text-sm text-tenunara-teal">
        Temukan limbah kain yang sesuai kebutuhan Anda
      </p>

      <div className="mt-4">
        <SearchBar onSearch={handleSearch} initialQuery={query} isLoading={loading} />
      </div>

      <div className="mt-3">
        <SearchFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Results area */}
      <div className="mt-6">
        {!query.trim() ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Search className="h-12 w-12 text-tenunara-teal/30" />
            <p className="text-sm text-tenunara-teal">Masukkan kata kunci pencarian</p>
          </div>
        ) : loading ? (
          <>
            <p className="mb-4 text-sm text-tenunara-teal">
              Mencari hasil untuk &ldquo;{query}&rdquo;...
            </p>
            <ListingSkeleton />
          </>
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Package className="h-12 w-12 text-tenunara-teal/30" />
            <h3 className="text-lg font-semibold text-tenunara-charcoal">Tidak ada hasil</h3>
            <p className="max-w-sm text-sm text-tenunara-teal">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;. Coba kata kunci lain.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-tenunara-teal">
              Menampilkan {filtered.length} hasil untuk &ldquo;{query}&rdquo;
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <SearchResultCard
                  key={item.id}
                  item={item}
                  onClick={() => router.push(`/dashboard/listings/${item.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SearchResultCard({
  item,
  onClick,
}: {
  item: SearchResultItem
  onClick: (id: string) => void
}) {
  const [imgError, setImgError] = useState(false)
  const [imgLoading, setImgLoading] = useState(true)

  return (
    <button
      onClick={() => onClick(item.id)}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-tenunara-mint">
        {imgLoading && !imgError && (
          <div className="absolute inset-0 animate-pulse bg-tenunara-teal/10" />
        )}
        {imgError ? (
          <div className="flex h-full items-center justify-center">
            <Package className="h-8 w-8 text-tenunara-teal/30" />
          </div>
        ) : (
          <img
            src={item.image_url || "/dummy1.png"}
            alt={item.title}
            className={cn(
              "h-full w-full object-cover transition-all duration-300 group-hover:scale-105",
              imgLoading ? "opacity-0" : "opacity-100",
            )}
            onLoad={() => setImgLoading(false)}
            onError={() => {
              setImgLoading(false)
              setImgError(true)
            }}
          />
        )}

        {/* Similarity badge */}
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-tenunara-charcoal shadow-sm backdrop-blur-sm">
          {Math.round(item.similarity * 100)}% cocok
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-tenunara-charcoal group-hover:text-tenunara-terracotta">
          {item.title}
        </h3>
        <p className="text-xs text-tenunara-teal">
          {item.seller_name}
          {item.seller_company && ` · ${item.seller_company}`}
        </p>
        <p className="mt-auto pt-1 text-base font-bold text-tenunara-terracotta">
          Rp {item.price_per_kg.toLocaleString("id-ID")}
          <span className="text-xs font-normal text-tenunara-teal"> /kg</span>
        </p>
      </div>
    </button>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-tenunara-terracotta" />
          </div>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  )
}
