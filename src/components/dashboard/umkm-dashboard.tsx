"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, Trash2, Leaf, Users, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { SustainabilityReportButton } from "@/components/dashboard/sustainability-report-button";
import { ErrorState } from "@/components/shared";
import { formatCurrency } from "@/lib/utils";
import type { UmkmDashboardResponse } from "@/lib/types";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-[#E5DDD5] bg-white shadow-sm"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-[#E5DDD5] bg-white shadow-sm" />
      <div className="h-64 animate-pulse rounded-2xl border border-[#E5DDD5] bg-white shadow-sm" />
    </div>
  );
}

export function UmkmDashboard() {
  const [data, setData] = useState<UmkmDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("sb-access-token");

    if (!token) {
      setError("Sesi tidak ditemukan. Silakan login kembali.");
      setLoading(false);
      return;
    }

    fetch("/api/dashboard/umkm", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Gagal memuat data dashboard");
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader />
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!data) return null;

  // "Penghematan Biaya Pengrajin" is NOT directly available from the API.
  // We estimate it as 30% of local_economic_multiplier (completed order value):
  // craftsmen save ~30% vs buying new fabric (waste fabric price is ~70% of new).
  const craftsmanSavings = data.impact.local_economic_multiplier * 0.3;

  return (
    <div ref={reportRef} className="space-y-6">
      {/* Header with PDF export button */}
      <div className="flex items-start justify-between">
        <PageHeader />
        <SustainabilityReportButton reportRef={reportRef} />
      </div>

      {/* Row 1: 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Rasio Pengalihan"
          value={`${data.metrics.landfill_diversion_rate}%`}
          sublabel={`dari ${data.metrics.total_waste_generated_kg.toLocaleString("id-ID")} kg total`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={data.metrics.landfill_diversion_rate > 50 ? "up" : "neutral"}
          trendLabel={
            data.metrics.landfill_diversion_rate > 50
              ? "Di atas target 50%"
              : "Perlu ditingkatkan"
          }
        />
        <StatCard
          label="Total Dialihkan"
          value={`${data.metrics.total_waste_diverted_kg.toLocaleString("id-ID")} kg`}
          sublabel="limbah kain terkelola"
          icon={<Trash2 className="h-5 w-5" />}
        />
        <StatCard
          label="CO₂ Dicegah"
          value={`${data.impact.co2e_avoided_kg.toLocaleString("id-ID")} kg`}
          sublabel="setara emisi CO₂e"
          icon={<Leaf className="h-5 w-5" />}
          trend="up"
          trendLabel="Dampak positif lingkungan"
        />
        <StatCard
          label="Penghematan Biaya Pengrajin"
          value={formatCurrency(craftsmanSavings)}
          sublabel="estimasi hemat 30%"
          icon={<Users className="h-5 w-5" />}
          trend="up"
          trendLabel="Dari harga kain baru"
        />
      </div>

      {/* Row 2: Trend Chart */}
      <div>
        <TrendChart data={data.trend} />
      </div>

      {/* Row 3: Transaction Table */}
      <div>
        <TransactionTable transactions={data.transactions} />
      </div>

      {/* Governance footer */}
      <p className="text-right text-[10px] italic text-[#4F626366]">
        {data.governance.auditor_log}
      </p>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-tenunara-charcoal">Dashboard</h1>
      <p className="mt-1 text-sm text-tenunara-teal">
        Ringkasan kinerja keberlanjutan dan transaksi Anda
      </p>
    </div>
  );
}
