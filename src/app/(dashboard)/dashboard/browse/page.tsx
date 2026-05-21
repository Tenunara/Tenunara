"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import { ListingCard } from "@/components/listing/listing-card";
import { SearchBar } from "@/components/search/search-bar";
import {
  SearchFilters,
  type FilterState,
} from "@/components/search/search-filters";
import { EmptyState, ErrorState } from "@/components/shared";
import { fetchDashboardProducts } from "@/lib/api";
import { MATERIAL_LABEL } from "@/lib/constants";
import type {
  ListingWithSeller,
  Color,
  Grade,
  Material,
  SizeEstimate,
  ListingStatus,
  Condition,
} from "@/lib/types";

const PAGE_SIZE = 12;

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
  );
}

type DashboardItem = Record<string, unknown>;

function mapToListing(item: DashboardItem): ListingWithSeller {
  const umkm = (item.umkm as Record<string, unknown>) || {};
  const ai = (item.ai_attributes as Record<string, unknown>) || {};
  const status = (item.status as string) || "";

  return {
    id: item.id as string,
    seller_id: (umkm.id as string) || "",
    title: `${item.fabric_name || "Kain"} ${item.total_weight_kg || 0}kg`,
    description: (item.fiber_composition as string) || null,
    material: "other" as Material,
    color: (ai.dominant_color_name as Color) || ("multicolor" as Color),
    size_estimate: "medium" as SizeEstimate,
    condition: "clean" as Condition,
    grade: ((item.final_grade as string) || "B") as Grade,
    quantity_kg: Number(item.total_weight_kg) || 0,
    price_per_kg: Number(item.price_per_kg) || 0,
    image_url: (item.images_url as string) || null,
    status:
      status === "sold"
        ? ("sold" as ListingStatus)
        : ("active" as ListingStatus),
    created_at: (item.created_at as string) || "",
    seller_name: (umkm.store_name as string) || "",
    seller_company: (umkm.kota as string) || null,
  };
}

const defaultFilters: FilterState = {
  material: null,
  grade: null,
  minPricePerKg: null,
  maxPricePerKg: null,
  minQuantityKg: null,
};

export default function BrowsePage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [filtered, setFiltered] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const prevApiParams = useRef("");

  const buildApiParams = useCallback(
    (f: FilterState, query: string) => {
      const params: Record<string, string | number | undefined> = {
        page,
        limit: PAGE_SIZE,
        ...(f.grade && { grade: f.grade }),
        ...(f.minPricePerKg !== null && { min_price: f.minPricePerKg }),
        ...(f.maxPricePerKg !== null && { max_price: f.maxPricePerKg }),
        ...(query && { search: query }),
        sort_by: "created_at",
        sort_order: "desc",
      };
      return params;
    },
    [page],
  );

  // Fetch from API when server-side filters change
  useEffect(() => {
    const apiParams = buildApiParams(filters, searchQuery);
    const paramKey = JSON.stringify(apiParams);

    if (prevApiParams.current === paramKey) return;
    prevApiParams.current = paramKey;

    setLoading(true);
    setError(null);

    fetchDashboardProducts(apiParams)
      .then((res) => {
        const items = (res.data || []) as DashboardItem[];
        const mapped = items.map(mapToListing);
        setListings(mapped);

        const meta = res.meta || {};
        const total = meta.total_products || 0;
        setTotalProducts(total);
        setTotalPages(Math.ceil(total / PAGE_SIZE));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [
    filters.grade,
    filters.minPricePerKg,
    filters.maxPricePerKg,
    searchQuery,
    page,
    buildApiParams,
  ]);

  // Apply client-side filters (material, minQuantityKg)
  useEffect(() => {
    let result = [...listings];

    if (filters.material) {
      result = result.filter((item) => item.material === filters.material);
    }
    if (filters.minQuantityKg !== null) {
      result = result.filter(
        (item) => item.quantity_kg >= filters.minQuantityKg!,
      );
    }

    setFiltered(result);
  }, [listings, filters.material, filters.minQuantityKg]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((f: FilterState) => {
    setFilters(f);
    setPage(1);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > totalPages) return;
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [totalPages],
  );

  const handleCardClick = useCallback(
    (id: string) => {
      router.push(`/dashboard/listings/${id}`);
    },
    [router],
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader onSearch={handleSearch} />

      <div className="mt-4">
        <SearchFilters filters={filters} onChange={handleFilterChange} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="mt-6">
          <ListingSkeleton />
        </div>
      ) : error ? (
        <div className="mt-8">
          <ErrorState
            message={error}
            onRetry={() => {
              prevApiParams.current = "";
              setPage(1);
            }}
          />
        </div>
      ) : filtered.length === 0 ? (
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
            Menampilkan {filtered.length} dari {totalProducts} material tersedia
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                variant="grid"
                onClick={handleCardClick}
              />
            ))}
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
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-tenunara-terracotta text-white"
                      : "border border-border text-tenunara-teal hover:bg-tenunara-mint/50"
                  }`}
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
  );
}

function PageHeader({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-tenunara-charcoal">
        Cari Material
      </h1>
      <p className="mt-1 text-sm text-tenunara-teal">
        Temukan limbah kain yang sesuai kebutuhan Anda
      </p>
      <div className="mt-4">
        <SearchBar onSearch={onSearch} />
      </div>
    </div>
  );
}
