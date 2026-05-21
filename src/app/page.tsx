// DESIGN DIRECTION: Warm Artisanal Tech — textile craft studio meets precision analytics
// ONE UNFORGETTABLE THING: Hero headline with light/bold/terracotta weight contrast + grain-textured canvas
// FONT CHOICE: Playfair Display (heading — editorial serif warmth) + DM Sans (body — clean readability)
// LAYOUT APPROACH: 60/40 asymmetric hero, grid-breaking metric card that overlaps sections, 2×2 feature grid with varied surfaces

import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  ScanLine,
  GitMerge,
  ShieldCheck,
  BarChart3,
  Check,
  Leaf,
} from "lucide-react"

const NAV_LINKS = [
  { label: "Pasar Material", href: "/dashboard/browse" },
  { label: "Teknologi AI", href: "#features" },
  { label: "Dampak Bisnis", href: "#metrics" },
]

const TRUST_BADGES = [
  { label: "Gratis Bergabung", icon: Check },
  { label: "Escrow Aman", icon: ShieldCheck },
  { label: "AI Grading", icon: ScanLine },
]

const METRICS = [
  { value: "10 Ton", description: "Target pengalihan limbah tekstil dari TPA, tahun pertama" },
  { value: "20%", description: "Efisiensi biaya pengadaan bahan baku pengrajin lokal" },
  { value: "50%", description: "Target tingkat transaksi berulang per kuartal" },
]

const FEATURES = [
  {
    icon: ScanLine,
    title: "Unggah & Penanda Visual AI",
    description:
      "Computer Vision mendeteksi jenis bahan, warna, dan estimasi ukuran secara otomatis dari satu foto kain sisa produksi.",
    surface: "canvas",
  },
  {
    icon: GitMerge,
    title: "Mesin Pencocokan Semantik",
    description:
      'NLP yang memahami konteks — "jins" otomatis dicocokkan dengan "denim" tanpa perlu kata kunci identik.',
    surface: "white",
  },
  {
    icon: ShieldCheck,
    title: "Penilaian & Kepercayaan Otomatis",
    description:
      "Klasifikasi Grade A/B/C dengan escrow dan pemeriksaan fisik 3 hari untuk keamanan setiap transaksi.",
    surface: "white",
  },
  {
    icon: BarChart3,
    title: "Dasbor Pengalihan Limbah",
    description:
      "Alat kepatuhan real-time untuk memantau volume limbah teralihkan — siap digunakan sebagai data Laporan ESG perusahaan.",
    surface: "mint",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-tenunara-canvas font-body">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 border-b border-tenunara-charcoal/5 bg-tenunara-white/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/images/logo.png"
              alt="TENUNARA"
              width={140}
              height={36}
              className="h-8 w-auto object-contain md:h-9"
              priority
            />
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="nav-link-hover text-sm font-medium text-tenunara-teal transition-colors hover:text-tenunara-charcoal"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-tenunara-terracotta transition-colors hover:text-tenunara-charcoal sm:block"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-tenunara-terracotta px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(156,74,60,0.3)] transition-all duration-200 hover:bg-tenunara-terracotta/90 hover:shadow-[0_6px_24px_rgba(156,74,60,0.4)]"
            >
              Bergabung Sebagai Mitra
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="grain-bg overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-14 md:px-8 md:pt-20 lg:grid-cols-[1.5fr_1fr] lg:gap-16 lg:pb-24">
          {/* Left — Text */}
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-tenunara-mint px-4 py-1.5 text-[11px] font-bold tracking-wider text-tenunara-teal uppercase">
              <span className="text-tenunara-terracotta">✦</span>
              Ekosistem Tekstil Sirkular Indonesia
            </span>

            <h1 className="font-heading mt-7 text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.05] font-light text-tenunara-charcoal">
              Menganyam Limbah,
              <br />
              <strong className="font-bold">Menghadirkan Nilai,</strong>
              <br />
              <span className="text-tenunara-terracotta">Merajut Masa Depan.</span>
            </h1>

            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-tenunara-teal">
              TENUNARA mengubah sisa produksi kain milik UMKM konveksi menjadi aset
              bernilai bagi pengrajin kriya lokal — melalui teknologi pencocokan
              berbasis AI dan transparansi rantai pasok.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register?role=seller"
                className="inline-flex items-center gap-2 rounded-xl bg-tenunara-terracotta px-7 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(156,74,60,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(156,74,60,0.4)]"
              >
                Mulai Kemitraan B2B
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/browse"
                className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-tenunara-teal/30 px-7 py-3.5 text-sm font-semibold text-tenunara-teal transition-all duration-200 hover:border-tenunara-teal/60 hover:bg-tenunara-mint/30"
              >
                Lihat Katalog Material
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-5">
              {TRUST_BADGES.map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 text-xs font-medium text-tenunara-teal">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-tenunara-mint text-tenunara-terracotta">
                    <badge.icon className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  {badge.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Visual Cards */}
          <div className="relative hidden min-h-[360px] lg:block">
            {/* Scan preview card */}
            <div className="rounded-3xl border border-tenunara-charcoal/[0.08] bg-white p-4 shadow-[0_8px_30px_rgba(85,67,63,0.1)]">
              <div className="relative h-44 overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a6b7a] via-[#2d4a5a] to-[#3a5a6a]">
                {/* Denim texture */}
                <div className="absolute inset-0 opacity-[0.12]" style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.25) 2px,rgba(255,255,255,0.25) 3px),repeating-linear-gradient(90deg,transparent,transparent 2px,rgba(255,255,255,0.25) 2px,rgba(255,255,255,0.25) 3px)",
                }} />
                {/* Scan box */}
                <div className="absolute top-5 left-5 h-[72px] w-[72px] rounded-lg border-2 border-tenunara-terracotta/80" />
                {/* Scan line */}
                <div className="scan-line" />
                {/* Badge */}
                <span className="animate-pulse-badge absolute top-3 left-3 rounded-md bg-tenunara-terracotta px-2.5 py-1 text-[9px] font-bold tracking-wide text-white uppercase">
                  ● AI Scanning
                </span>
              </div>
              <p className="mt-2.5 text-[11px] font-medium text-tenunara-teal">
                Preview scan material
              </p>
            </div>

            {/* Grade card — overlapping */}
            <div className="absolute -right-3 bottom-6 w-48 rounded-2xl border border-tenunara-charcoal/[0.08] bg-white p-4 shadow-[0_6px_24px_rgba(85,67,63,0.12)] animate-float">
              <p className="text-[10px] font-medium text-tenunara-teal">Quality Score</p>
              <p className="font-heading text-[28px] font-bold leading-tight text-tenunara-charcoal">
                Grade B
              </p>
              <span className="mt-1 inline-block rounded-full bg-tenunara-mint px-2.5 py-0.5 text-[9px] font-bold tracking-wide text-tenunara-teal uppercase">
                Terverifikasi AI
              </span>
            </div>

            {/* Floating stat — overlapping */}
            <div className="absolute -left-5 bottom-24 flex items-center gap-2.5 rounded-xl border border-tenunara-charcoal/[0.08] bg-white px-3.5 py-2.5 shadow-[0_4px_16px_rgba(85,67,63,0.08)] animate-float-delayed">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-tenunara-mint text-grade-success">
                <Leaf className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[13px] font-bold leading-none text-tenunara-charcoal">
                  3.2 ton
                </p>
                <p className="text-[9px] text-tenunara-teal">dialihkan minggu ini</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Metrics — Grid breaker: overlaps into features section ─── */}
      <section id="metrics" className="relative z-10 -mb-16 px-5 md:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-tenunara-charcoal/[0.06] bg-white px-8 py-10 shadow-[0_8px_30px_rgba(85,67,63,0.1)] md:px-12 md:py-12">
          <div className="grid gap-8 sm:grid-cols-3 sm:gap-0">
            {METRICS.map((metric, i) => (
              <div
                key={metric.value}
                className={`text-center ${i > 0 ? "sm:border-l sm:border-tenunara-charcoal/[0.08] sm:pl-8" : ""}`}
              >
                <p className="font-heading text-[clamp(2.8rem,6vw,4.5rem)] font-bold leading-none text-tenunara-charcoal">
                  {metric.value}
                </p>
                <p className="mx-auto mt-2 max-w-[200px] text-[12px] leading-snug text-tenunara-teal">
                  {metric.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features 2×2 ─── */}
      <section id="features" className="bg-white pb-20 pt-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold text-tenunara-charcoal md:text-3xl">
              Teknologi di Balik TENUNARA
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-tenunara-teal">
              Empat pilar yang membedakan kami dari marketplace tekstil biasa
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className={`rounded-3xl border p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(85,67,63,0.1)] ${
                  feature.surface === "canvas"
                    ? "border-tenunara-charcoal/[0.06] bg-tenunara-canvas"
                    : feature.surface === "mint"
                      ? "border-tenunara-charcoal/[0.06] bg-tenunara-mint"
                      : "border-tenunara-charcoal/[0.08] bg-white shadow-sm"
                }`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  feature.surface === "mint" ? "bg-tenunara-canvas" : "bg-tenunara-mint"
                } text-tenunara-terracotta`}>
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-tenunara-charcoal">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-tenunara-teal">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI Simulation ─── */}
      <section className="grain-bg py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold text-tenunara-charcoal md:text-3xl">
              Lihat AI Kami Bekerja
            </h2>
            <p className="mt-2 text-sm text-tenunara-teal">
              Simulasi analisis material secara real-time
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {/* Left — Scan Area */}
            <div className="relative h-64 overflow-hidden rounded-3xl bg-gradient-to-br from-[#4a6b7a] via-[#2d4a5a] to-[#3a5a6a] md:h-80">
              <div className="absolute inset-0 opacity-[0.12]" style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.25) 2px,rgba(255,255,255,0.25) 3px),repeating-linear-gradient(90deg,transparent,transparent 2px,rgba(255,255,255,0.25) 2px,rgba(255,255,255,0.25) 3px)",
              }} />
              {/* Corner brackets */}
              <div className="absolute top-6 left-6 h-10 w-10 border-t-2 border-l-2 border-tenunara-terracotta/70" />
              <div className="absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 border-tenunara-terracotta/70" />
              {/* Scan line */}
              <div className="scan-line" />
              {/* Label */}
              <span className="animate-pulse-badge absolute top-4 right-4 rounded-md bg-tenunara-terracotta px-3 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                ● Live Scan
              </span>
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm font-medium text-white/40">Denim Texture Sample</p>
              </div>
            </div>

            {/* Right — Scorecard */}
            <div className="rounded-3xl border border-tenunara-charcoal/[0.08] bg-white p-7 shadow-[0_4px_20px_rgba(85,67,63,0.08)] md:p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-tenunara-charcoal">Hasil Analisis AI</h3>
                <span className="rounded-full bg-tenunara-canvas px-3 py-1 text-[10px] font-medium text-tenunara-teal">
                  Baru saja
                </span>
              </div>

              <div className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 text-[13px]">
                <span className="text-tenunara-teal">Jenis Material</span>
                <span className="font-semibold text-tenunara-charcoal">Denim Biru Potongan (&gt;30 cm)</span>
                <span className="text-tenunara-teal">Kerapatan Benang</span>
                <span className="font-semibold text-tenunara-charcoal">120 PPI</span>
                <span className="text-tenunara-teal">Berat Kain</span>
                <span className="font-semibold text-tenunara-charcoal">180 GSM</span>
              </div>

              <div className="mt-6 border-t border-tenunara-charcoal/[0.08] pt-5">
                <span className="inline-block rounded-full bg-grade-success px-3 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                  Grade B — Terverifikasi AI
                </span>
              </div>

              <div className="mt-5 rounded-2xl bg-tenunara-canvas p-4">
                <p className="text-[11px] font-semibold text-tenunara-charcoal">Pencocokan Aktif:</p>
                <p className="mt-1 text-[12px] leading-relaxed text-tenunara-teal">
                  Terhubung otomatis dengan 1 permintaan pengrajin di Yogyakarta
                  (Kebutuhan: min. 50 kg)
                </p>
                <Link
                  href="/dashboard/browse"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-tenunara-terracotta/30 px-4 py-2 text-[11px] font-semibold text-tenunara-terracotta transition-colors hover:bg-tenunara-terracotta/5"
                >
                  Lihat Detail Permintaan
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="bg-tenunara-charcoal">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center md:py-20">
          <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
            Siap Mengubah Limbah Tekstil Menjadi Peluang Ekonomi Baru?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/60">
            Bergabunglah bersama UMKM konveksi dan pengrajin lokal yang membangun
            rantai pasok tekstil hijau Indonesia.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-tenunara-terracotta px-8 py-4 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(156,74,60,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(156,74,60,0.5)]"
          >
            Daftar Sebagai Mitra Sekarang
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-tenunara-charcoal/[0.06] bg-white py-6 text-center">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 md:flex-row md:justify-between md:px-8">
          <Image
            src="/images/logo.png"
            alt="TENUNARA"
            width={100}
            height={28}
            className="h-6 w-auto object-contain opacity-60"
          />
          <p className="text-[11px] text-tenunara-teal/60">
            &copy; {new Date().getFullYear()} TENUNARA. Dibuat untuk hackathon.
          </p>
        </div>
      </footer>
    </div>
  )
}
