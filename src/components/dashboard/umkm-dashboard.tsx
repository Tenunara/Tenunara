"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Trash2,
  Leaf,
  Users,
  Loader2,
  Store,
  MapPin,
  Package,
  Plus,
  BarChart3,
  Search,
  ArrowRight,
  Recycle,
  HeartHandshake,
  ScrollText,
  Sparkles,
  Building2,
  Award,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { SustainabilityReportButton } from "@/components/dashboard/sustainability-report-button";
import { ErrorState } from "@/components/shared";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { UmkmDashboardResponse } from "@/lib/types";

/* ─── Animated counter ─── */

function AnimatedValue({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const num = value;
    const duration = 1000;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(eased * num).toLocaleString("id-ID") + suffix;
      if (t < 1) raf = requestAnimationFrame(tick);
      else el.textContent = num.toLocaleString("id-ID") + suffix;
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          raf = requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [value, suffix]);

  return (
    <span ref={ref}>
      {value.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

/* ─── Skeleton ─── */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="h-20 animate-pulse rounded-2xl border border-tenunara-charcoal/[0.06] bg-white shadow-sm" />
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-tenunara-charcoal/[0.06] bg-white shadow-sm"
          />
        ))}
      </div>
      {/* Distribution skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-tenunara-charcoal/[0.06] bg-white shadow-sm"
          />
        ))}
      </div>
      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-tenunara-charcoal/[0.06] bg-white shadow-sm"
          />
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="h-80 animate-pulse rounded-2xl border border-tenunara-charcoal/[0.06] bg-white shadow-sm" />
      {/* Table skeleton */}
      <div className="h-64 animate-pulse rounded-2xl border border-tenunara-charcoal/[0.06] bg-white shadow-sm" />
    </div>
  );
}

/* ─── Quick actions ─── */

const QUICK_ACTIONS = [
  {
    label: "Upload Produk Baru",
    description: "Jual limbah kain",
    href: "/dashboard/listings/new",
    icon: Plus,
    color: "text-tenunara-terracotta",
    bg: "bg-tenunara-terracotta/8",
  },
  {
    label: "Kelola Listing",
    description: "Lihat & edit produk",
    href: "/dashboard/listings",
    icon: Package,
    color: "text-tenunara-teal",
    bg: "bg-tenunara-teal/8",
  },
  {
    label: "Cari Pembeli",
    description: "Browse permintaan",
    href: "/dashboard/browse",
    icon: Search,
    color: "text-tenunara-charcoal",
    bg: "bg-tenunara-charcoal/8",
  },
  {
    label: "Laporan ESG",
    description: "Download PDF",
    href: "#",
    icon: BarChart3,
    color: "text-grade-success",
    bg: "bg-grade-success/8",
  },
];

/* ─── Main component ─── */

export function UmkmDashboard() {
  const [data, setData] = useState<UmkmDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="space-y-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!data) return null;

  const craftsmanSavings = data.impact.local_economic_multiplier * 0.3;
  const totalTransactions = data.transactions.length;
  const pendingPickups = data.transactions.filter(
    (t) => t.verification_status === "menunggu_penjemputan",
  ).length;
  const diversions = data.metrics.total_waste_diverted_kg;
  const generated = data.metrics.total_waste_generated_kg;
  const diversionPercent = data.metrics.landfill_diversion_rate;

  return (
    <div className="space-y-7 mx-0 md:mx-16">
      {/* ─── Welcome / Profile ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-tenunara-charcoal/[0.06] bg-gradient-to-br from-white via-white to-tenunara-canvas/50 p-6 shadow-sm md:p-8">
        {/* Decorative blob */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-tenunara-mint/30 blur-[50px]" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-tenunara-terracotta/5 blur-[40px]" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tenunara-mint text-tenunara-terracotta shadow-sm">
              <Store className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-tenunara-charcoal md:text-2xl">
                Selamat Datang,{" "}
                <span className="text-tenunara-terracotta">
                  {data.profile.nama_toko}
                </span>
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tenunara-teal">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {data.profile.kota}, {data.profile.kabupaten}
                </span>
                {data.profile.skala_usaha && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Usaha {data.profile.skala_usaha}
                  </span>
                )}
                {totalTransactions > 0 && (
                  <span className="inline-flex items-center gap-1 font-medium text-tenunara-terracotta">
                    <Sparkles className="h-3 w-3" />
                    {totalTransactions} transaksi terselesaikan
                  </span>
                )}
              </div>
            </div>
          </div>

          <SustainabilityReportButton />
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Rasio Pengalihan"
          value={`${diversionPercent}%`}
          sublabel={`dari ${formatNumber(generated)} kg total`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={diversionPercent > 50 ? "up" : "neutral"}
          trendLabel={
            diversionPercent > 50 ? "Di atas target 50%" : "Perlu ditingkatkan"
          }
        />
        <StatCard
          label="Total Dialihkan"
          value={`${formatNumber(diversions)} kg`}
          sublabel="limbah kain terkelola"
          icon={<Trash2 className="h-5 w-5" />}
        />
        <StatCard
          label="CO₂ Dicegah"
          value={`${formatNumber(data.impact.co2e_avoided_kg)} kg`}
          sublabel="setara emisi CO₂e"
          icon={<Leaf className="h-5 w-5" />}
          trend="up"
          trendLabel="Dampak positif lingkungan"
        />
        <StatCard
          label="Hemat Biaya Pengrajin"
          value={formatCurrency(craftsmanSavings)}
          sublabel="estimasi hemat 30%"
          icon={<Users className="h-5 w-5" />}
          trend="up"
          trendLabel="Dari harga kain baru"
        />
      </div>

      {/* ─── Distribution & Impact ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Upcycle */}
        <div className="group rounded-2xl border border-tenunara-charcoal/[0.06] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tenunara-mint text-tenunara-terracotta">
              <Recycle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-tenunara-charcoal">
            <AnimatedValue
              value={data.distribution.upcycle_volume_kg}
              suffix=" kg"
            />
          </p>
          <p className="text-xs text-tenunara-teal">Volume Upcycle</p>
        </div>

        {/* Recycle */}
        <div className="group rounded-2xl border border-tenunara-charcoal/[0.06] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tenunara-mint text-tenunara-teal">
              <Leaf className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-tenunara-charcoal">
            <AnimatedValue
              value={data.distribution.recycle_volume_kg}
              suffix=" kg"
            />
          </p>
          <p className="text-xs text-tenunara-teal">Volume Recycle</p>
        </div>

        {/* Active partners */}
        <div className="group rounded-2xl border border-tenunara-charcoal/[0.06] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tenunara-mint text-tenunara-terracotta">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-tenunara-charcoal">
            <AnimatedValue value={data.distribution.active_partner_count} />
          </p>
          <p className="text-xs text-tenunara-teal">Mitra Aktif</p>
        </div>
      </div>

      {/* ─── Trend Chart ─── */}
      <div>
        <TrendChart data={data.trend} />
      </div>

      {/* ─── Transaction Table ─── */}
      <div>
        <TransactionTable transactions={data.transactions} />
      </div>

      {/* ─── Governance ─── */}
      <div className="flex items-start gap-3 rounded-2xl border border-tenunara-charcoal/[0.06] bg-white p-5 shadow-sm">
        <Award className="mt-0.5 h-5 w-5 shrink-0 text-tenunara-teal/50" />
        <div>
          <p className="text-xs font-semibold text-tenunara-charcoal">
            Catatan Tata Kelola
          </p>
          <p className="mt-1 text-[11px] italic leading-relaxed text-tenunara-teal/60">
            {data.governance.auditor_log}
          </p>
        </div>
      </div>

      {/* ─── Pending Pickup Alert ─── */}
      {pendingPickups > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-tenunara-terracotta/15 bg-tenunara-terracotta/5 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tenunara-terracotta/10 text-tenunara-terracotta">
            <Package className="h-4 w-4" />
          </div>
          <p className="flex-1 text-xs text-tenunara-charcoal">
            Kamu punya{" "}
            <strong className="text-tenunara-terracotta">
              {pendingPickups} transaksi
            </strong>{" "}
            menunggu penjemputan. Segera atasi jadwal pengiriman.
          </p>
          <Link
            href="/dashboard/transactions"
            className="shrink-0 text-xs font-semibold text-tenunara-terracotta underline-offset-2 hover:underline"
          >
            Lihat
          </Link>
        </div>
      )}
    </div>
  );
}
