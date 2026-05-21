"use client";

import { useState } from "react";
import type { SemanticSearchResult, ParsedQuery } from "@/lib/types";

// ─── Hook ──────────────────────────────────────────────────────────

export function useSemanticSearch() {
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(query: string, pengrajinKota?: string) {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);
    setParsedQuery(null);

    try {
      const token = localStorage.getItem("sb-access-token");
      const userId = localStorage.getItem("sb-user-id");

      const res = await fetch("/api/search/semantic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: query.trim(),
          pengrajin_id: userId ?? null,
          pengrajin_kota: pengrajinKota ?? null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Pencarian gagal");
      }

      const data = await res.json();
      setResults(data.results ?? []);
      setParsedQuery(data.parsed_query ?? null);
    } catch (err: any) {
      setError(err.message ?? "Pencarian gagal");
    } finally {
      setIsLoading(false);
    }
  }

  return { search, results, parsedQuery, isLoading, error };
}
