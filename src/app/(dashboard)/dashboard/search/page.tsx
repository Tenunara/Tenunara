"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Package, Loader2 } from "lucide-react"
import { SearchBar } from "@/components/search/search-bar"
import { SearchFilters, type FilterState } from "@/components/search/search-filters"
import { SemanticResultCard } from "@/components/search/semantic-result-card"
import { ErrorState } from "@/components/shared"
import type { SemanticSearchResult, ParsedQuery } from "@/lib/types"

const defaultFilters: FilterState = {
  material: null,
  grade: null,
  minPricePerKg: null,
  maxPricePerKg: null,
  minQuantityKg: null,
}

interface SemanticResponse {
  results: SemanticSearchResult[]
  parsed_query: ParsedQuery
  from_cache: boolean
}

// Material filter mapping: Material type values → fabric_type_name patterns
const MATERIAL_NAME_MAP: Record<string, string[]> = {
  cotton:  ["Katun", "Cotton"],
  denim:   ["Denim"],
  polyester: ["Polyester", "TC (Tetoron Cotton)", "Cotton Polyester"],
  mixed:   ["CVC", "Campuran", "Blend"],
  other:   ["Rayon", "Drill", "Spandex", "Nylon", "Kanvas", "Sutra", "Wol", "Linen"],
}

function matchFilterMaterial(fabricTypeName: string, filterMaterial: string): boolean {
  const patterns = MATERIAL_NAME_MAP[filterMaterial]
  if (!patterns) return false
  const lowerName = fabricTypeName.toLowerCase()
  return patterns.some((p) => lowerName.includes(p.toLowerCase()))
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

function SearchResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const [results, setResults] = useState<SemanticSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [fromCache, setFromCache] = useState(false)

  const handleSearch = useCallback(
    (q: string) => {
      if (q.trim()) {
        router.push(`/dashboard/search?q=${encodeURIComponent(q.trim())}`)
      }
    },
    [router],
  )

  // Fetch from real semantic search API
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    fetch("/api/search/semantic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.trim() }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Pencarian gagal")
        return res.json() as Promise<SemanticResponse>
      })
      .then((json) => {
        setResults(json.results ?? [])
        setParsedQuery(json.parsed_query ?? null)
        setFromCache(json.from_cache ?? false)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [query])

  // Apply client-side filters (for narrowing after semantic results)
  const filtered = results.filter((item) => {
    if (filters.material && !matchFilterMaterial(item.fabric_type_name, filters.material)) return false
    if (filters.grade && item.final_grade !== filters.grade) return false
    if (filters.minPricePerKg !== null && item.price_per_kg < filters.minPricePerKg) return false
    if (filters.maxPricePerKg !== null && item.price_per_kg > filters.maxPricePerKg) return false
    if (filters.minQuantityKg !== null && item.total_weight_kg < filters.minQuantityKg) return false
    return true
  })

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
          <ErrorState message={error} onRetry={() => handleSearch(query)} />
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
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-tenunara-teal">
                Menampilkan {filtered.length} hasil untuk &ldquo;{query}&rdquo;
                {fromCache && (
                  <span className="ml-2 text-[11px] text-tenunara-teal/50">(dari cache)</span>
                )}
              </p>
              {parsedQuery && (
                <p className="text-[11px] text-tenunara-teal/50">
                  {parsedQuery.fabric_type && `Bahan: ${parsedQuery.fabric_type}`}
                  {parsedQuery.color && ` · Warna: ${parsedQuery.color}`}
                  {parsedQuery.grade && ` · Grade: ${parsedQuery.grade}`}
                </p>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <SemanticResultCard
                  key={item.product_id}
                  result={item}
                  onClick={(pid) => router.push(`/dashboard/listings/${pid}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
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
