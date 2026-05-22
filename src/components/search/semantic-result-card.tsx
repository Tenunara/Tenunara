"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { GradeBadge } from "@/components/listing/grade-badge";
import type { SemanticSearchResult } from "@/lib/types";

// ─── Helpers ────────────────────────────────────────────────────────

function extractColorName(colorStr: string): string {
  if (!colorStr) return ""
  const afterHex = colorStr.split(";").pop() ?? colorStr
  return afterHex.trim()
}

// ─── Props ─────────────────────────────────────────────────────────

interface SemanticResultCardProps {
  result: SemanticSearchResult;
  onClick: (productId: string) => void;
}

// ─── Match Score Bar ───────────────────────────────────────────────

function MatchScoreBar({ percent }: { percent: number }) {
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 overflow-hidden rounded-full bg-tenunara-teal/10 h-1.5">
        <div
          className="h-full rounded-full bg-tenunara-terracotta transition-all duration-500"
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      <span className="text-[11px] font-bold text-tenunara-terracotta whitespace-nowrap">
        {clampedPercent}%
      </span>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────

export function SemanticResultCard({ result, onClick }: SemanticResultCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const matchPercent = Math.min(Math.round(result.final_score * 100), 100);
  const firstImage = result.images_url?.[0];

  return (
    <button
      onClick={() => onClick(result.product_id)}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-tenunara-mint">
        {imgLoading && !imgError && (
          <div className="absolute inset-0 animate-pulse bg-tenunara-teal/10" />
        )}
        {imgError || !firstImage ? (
          <div className="flex h-full items-center justify-center">
            <Package className="h-8 w-8 text-tenunara-teal/30" />
          </div>
        ) : (
          <Image
            src={firstImage}
            alt={result.fabric_type_name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn(
              "object-cover transition-opacity duration-300",
              imgLoading ? "opacity-0" : "opacity-100",
            )}
            onLoad={() => setImgLoading(false)}
            onError={() => {
              setImgError(true);
              setImgLoading(false);
            }}
          />
        )}

        {/* Grade badge */}
        <div className="absolute left-3 top-3">
          <GradeBadge grade={result.final_grade as "A" | "B" | "C"} size="sm" />
        </div>

        {/* Match score badge */}
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-tenunara-charcoal shadow-sm backdrop-blur-sm">
          {matchPercent}% cocok
        </div>
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {/* Match score bar */}
        <MatchScoreBar percent={matchPercent} />

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-tenunara-charcoal group-hover:text-tenunara-terracotta">
          {result.fabric_type_name}
        </h3>

        {/* Seller & location */}
        <p className="text-xs text-tenunara-teal">
          {result.nama_toko}
          {result.kota ? ` · ${result.kota}` : ""}
        </p>

        {/* Attributes */}
        <p className="text-xs text-tenunara-teal/70">
          {[extractColorName(result.ai_dominant_color), result.ai_size_range, result.total_weight_kg ? `${result.total_weight_kg} kg` : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {/* Price */}
        <p className="mt-auto pt-1 text-base font-bold text-tenunara-terracotta">
          {formatCurrency(result.price_per_kg)}
          <span className="text-xs font-normal text-tenunara-teal"> /kg</span>
        </p>

        {/* Minimum order */}
        {result.minimum_order_kg && (
          <p className="text-[11px] text-tenunara-teal/60">
            Min. {result.minimum_order_kg} kg
          </p>
        )}
      </div>
    </button>
  );
}
