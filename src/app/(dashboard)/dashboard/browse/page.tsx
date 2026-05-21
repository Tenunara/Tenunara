"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Loader2, Sparkles } from "lucide-react";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { SemanticResultCard } from "@/components/search/semantic-result-card";
import { ErrorState } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ─── Example Queries ───────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  { label: "denim biru 50kg", query: "denim biru 50kg" },
  { label: "kain katun grade A", query: "kain katun grade A untuk kaos" },
  { label: "sisa kain batik murah", query: "sisa kain batik 30kg murah" },
];

// ─── Main Content ──────────────────────────────────────────────────

function BrowseContent() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { search, results, parsedQuery, isLoading, error } = useSemanticSearch();

  const handleSearch = useCallback(() => {
    if (query.trim()) search(query.trim());
  }, [query, search]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch],
  );

  const handleCardClick = useCallback(
    (productId: string) => {
      router.push(`/dashboard/listings/${productId}`);
    },
    [router],
  );

  const handleExampleClick = useCallback(
    (exampleQuery: string) => {
      setQuery(exampleQuery);
      search(exampleQuery);
    },
    [search],
  );

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-tenunara-mint p-2.5">
          <Sparkles className="h-6 w-6 text-tenunara-terracotta" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-tenunara-charcoal">
            Pencarian Cerdas
          </h1>
          <p className="mt-1 text-sm text-tenunara-teal">
            Cari sisa kain dengan bahasa alami &mdash; AI akan memahami kebutuhan Anda
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="mt-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-tenunara-teal/60" />
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Contoh: denim biru 50kg grade A untuk keset..."
            className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-32 text-sm text-tenunara-charcoal placeholder:text-tenunara-teal/40"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <Button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              size="sm"
              className="h-9 rounded-lg bg-tenunara-terracotta px-4 text-white hover:bg-tenunara-terracotta/90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Mencari...
                </>
              ) : (
                "Cari"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Parsed query badges */}
      {parsedQuery && (
        <div className="mt-4 flex flex-wrap gap-2">
          {parsedQuery.fabric_type && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Kain: {parsedQuery.fabric_type}
            </span>
          )}
          {parsedQuery.color && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Warna: {parsedQuery.color}
            </span>
          )}
          {parsedQuery.min_weight_kg && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Min. {parsedQuery.min_weight_kg} kg
            </span>
          )}
          {parsedQuery.grade && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              Grade {parsedQuery.grade}
            </span>
          )}
        </div>
      )}

      {/* Results area */}
      <div className="mt-6">
        {/* Idle state — no search performed yet */}
        {!isLoading && results.length === 0 && !error && !parsedQuery && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-full bg-tenunara-mint p-4">
              <Sparkles className="h-8 w-8 text-tenunara-teal/40" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-tenunara-charcoal">
                Cari sisa kain dengan bahasa alami
              </h3>
              <p className="mt-2 max-w-md text-sm text-tenunara-teal">
                Coba ketik seperti Anda berbicara: deskripsikan kain, warna, berat, atau
                grade yang Anda butuhkan.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUERIES.map((ex) => (
                <button
                  key={ex.query}
                  onClick={() => handleExampleClick(ex.query)}
                  className="rounded-full border border-border bg-white px-4 py-2 text-xs font-medium text-tenunara-teal transition-colors hover:border-tenunara-terracotta hover:text-tenunara-terracotta"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div>
            <p className="mb-4 text-sm text-tenunara-teal animate-pulse">
              Menganalisis dan mencari kecocokan...
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-3xl bg-white shadow-sm">
                  <div className="aspect-[4/3] w-full animate-pulse bg-tenunara-teal/10" />
                  <div className="space-y-2 p-4">
                    <div className="h-3 w-full animate-pulse rounded-lg bg-tenunara-teal/10" />
                    <div className="h-4 w-3/4 animate-pulse rounded-lg bg-tenunara-teal/10" />
                    <div className="h-3 w-1/2 animate-pulse rounded-lg bg-tenunara-teal/10" />
                    <div className="h-5 w-1/3 animate-pulse rounded-lg bg-tenunara-teal/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="mt-8">
            <ErrorState
              message={error}
              onRetry={handleSearch}
            />
          </div>
        )}

        {/* Results grid */}
        {!isLoading && !error && results.length > 0 && (
          <>
            <p className="mb-4 text-sm text-tenunara-teal">
              Ditemukan {results.length} hasil pencarian
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <SemanticResultCard
                  key={r.product_id}
                  result={r}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty results — search was done but no matches */}
        {!isLoading && !error && parsedQuery && results.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <Package className="h-12 w-12 text-tenunara-teal/30" />
            <div>
              <h3 className="text-base font-semibold text-tenunara-charcoal">
                Tidak ada hasil
              </h3>
              <p className="mt-1 max-w-md text-sm text-tenunara-teal">
                Tidak ditemukan produk yang cocok dengan kriteria Anda. Coba gunakan
                kata kunci yang lebih umum.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page Export (with Suspense) ───────────────────────────────────

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-6xl items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-tenunara-terracotta" />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
