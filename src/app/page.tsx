"use client"

import { useState } from "react"
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
  Star,
  MapPin,
  Users,
  Store,
} from "lucide-react"

const NAV_LINKS = [
  { label: "Pasar Material", href: "/dashboard/browse" },
  { label: "Cara Kerja", href: "#features" },
  { label: "Dampak", href: "#dampak" },
]

const TRUST_BADGES = [
  { label: "Gratis Daftar untuk UMKM", icon: Check },
  { label: "AI Grading Otomatis", icon: ScanLine },
  { label: "Pembayaran Escrow Aman", icon: ShieldCheck },
]

const METRICS = [
  { value: "10+ Ton", description: "Target pengalihan limbah tekstil dari TPA, tahun pertama" },
  { value: "20%", description: "Rata-rata efisiensi biaya bahan baku pengrajin lokal" },
  { value: "500+", description: "UMKM konveksi dan pengrajin yang bergabung di ekosistem TENUNARA" },
]

const FEATURES = [
  {
    icon: ScanLine,
    title: "AI Grading untuk Hasil Maksimal",
    description:
      "Cukup foto sisa kain produksi Anda. AI TENUNARA langsung mendeteksi jenis bahan, warna, ukuran, dan memberikan grade A/B/C secara otomatis — tanpa perlu keahlian teknis.",
    surface: "canvas",
  },
  {
    icon: GitMerge,
    title: "Pencocokan Cerdas ala Indonesia",
    description:
      "NLP yang paham konteks lokal. Cari 'jins' dapet 'denim', cari 'kain putih' muncul 'katun putih'. Cocok untuk UMKM yang ga mau ribet dengan kata kunci rumit.",
    surface: "white",
  },
  {
    icon: ShieldCheck,
    title: "Transaksi Aman & Terpercaya",
    description:
      "Sistem escrow + pemeriksaan fisik 3 hari. Kalau barang ga sesuai, uang kembali. Biar UMKM dan pengrajin sama-sama tenang bertransaksi.",
    surface: "white",
  },
  {
    icon: BarChart3,
    title: "Dasbor Kepatuhan & ESG",
    description:
      "Pantau volume limbah yang teralihkan dari TPA secara real-time. Data siap pakai buat laporan ESG perusahaan — bikin branding hijau UMKM Anda naik kelas.",
    surface: "mint",
  },
]

const DAERAH_UMKM = [
  { kota: "Bandung", jumlah: "120+", icon: MapPin },
  { kota: "Jakarta", jumlah: "85+", icon: MapPin },
  { kota: "Yogyakarta", jumlah: "60+", icon: MapPin },
  { kota: "Solo", jumlah: "45+", icon: MapPin },
  { kota: "Bogor", jumlah: "40+", icon: MapPin },
]

export default function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)

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
              Daftar Sebagai Mitra
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section — UMKM Indonesia ─── */}
      <section className="grain-bg overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-14 md:px-8 md:pt-20 lg:grid-cols-[1.5fr_1fr] lg:gap-16 lg:pb-24">
          {/* Left — Text */}
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-tenunara-mint px-4 py-1.5 text-[11px] font-bold tracking-wider text-tenunara-teal uppercase">
              <span className="text-tenunara-terracotta">✦</span>
              Ekosistem Tekstil Sirkular #BuatIndonesia
            </span>

            <h1 className="font-heading mt-7 text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.05] font-light text-tenunara-charcoal">
              Limbah Kain UMKM?
              <br />
              <strong className="font-bold">Jangan Dibuang,</strong>
              <br />
              <span className="text-tenunara-terracotta">Dijual ke Sesama Pengrajin.</span>
            </h1>

            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-tenunara-teal">
              TENUNARA adalah pasar digital <strong className="font-semibold text-tenunara-charcoal">khusus UMKM Indonesia</strong> yang
              menghubungkan konveksi dengan limbah kain melimpah — ke pengrajin lokal
              yang butuh bahan baku murah berkualitas. Semua berkat AI pencocokan
              buatan anak bangsa.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register?role=seller"
                className="inline-flex items-center gap-2 rounded-xl bg-tenunara-terracotta px-7 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(156,74,60,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(156,74,60,0.4)]"
              >
                Saya Mau Jual Limbah Kain
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/browse"
                className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-tenunara-teal/30 px-7 py-3.5 text-sm font-semibold text-tenunara-teal transition-all duration-200 hover:border-tenunara-teal/60 hover:bg-tenunara-mint/30"
              >
                Saya Cari Bahan Baku
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
              <p className="text-[10px] font-medium text-tenunara-teal">Skor Kualitas</p>
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
                  3,2 ton
                </p>
                <p className="text-[9px] text-tenunara-teal">teralihkan minggu ini</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Metrics — Grid breaker ─── */}
      <section id="dampak" className="relative z-10 -mb-16 px-5 md:px-8">
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

      {/* ─── Peta UMKM ─── */}
      <section className="bg-white pb-16 pt-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold text-tenunara-charcoal md:text-3xl">
              UMKM dari Seluruh <span className="text-tenunara-terracotta">Nusantara</span>
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-tenunara-teal">
              Dari Bandung sampai Makassar — konveksi dan pengrajin sudah bergabung di ekosistem TENUNARA
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {DAERAH_UMKM.map((daerah) => (
              <div
                key={daerah.kota}
                className="rounded-2xl border border-tenunara-charcoal/[0.06] bg-tenunara-canvas px-4 py-6 text-center transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-tenunara-mint text-tenunara-terracotta">
                  <daerah.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 font-heading text-xl font-bold text-tenunara-charcoal">
                  {daerah.jumlah}
                </p>
                <p className="mt-0.5 text-xs font-medium text-tenunara-teal">
                  UMKM &bull; {daerah.kota}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features 2×2 ─── */}
      <section id="features" className="bg-white pb-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold text-tenunara-charcoal md:text-3xl">
              Kenapa UMKM <span className="text-tenunara-terracotta">Pilih</span> TENUNARA?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-tenunara-teal">
              Teknologi AI yang memudahkan, bukan mempersulit. Dibuat khusus buat kebutuhan UMKM tekstil Indonesia.
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
              Lihat AI Kami <span className="text-tenunara-terracotta">Bekerja</span>
            </h2>
            <p className="mt-2 text-sm text-tenunara-teal">
              Simulasi real-time — tinggal foto, AI kami urus sisanya
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
                <p className="text-sm font-medium text-white/40">Sisa Kain UMKM</p>
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
                <span className="text-tenunara-teal">Jenis Bahan</span>
                <span className="font-semibold text-tenunara-charcoal">Denim Biru Potongan (&gt;30 cm)</span>
                <span className="text-tenunara-teal">Kualitas</span>
                <span className="font-semibold text-tenunara-charcoal">120 PPI — Layak Pakai</span>
                <span className="text-tenunara-teal">Estimasi Berat</span>
                <span className="font-semibold text-tenunara-charcoal">180 GSM</span>
              </div>

              <div className="mt-6 border-t border-tenunara-charcoal/[0.08] pt-5">
                <span className="inline-block rounded-full bg-grade-success px-3 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                  Grade B — Layak Jual
                </span>
              </div>

              <div className="mt-5 rounded-2xl bg-tenunara-canvas p-4">
                <p className="text-[11px] font-semibold text-tenunara-charcoal">Cocok dengan:</p>
                <p className="mt-1 text-[12px] leading-relaxed text-tenunara-teal">
                  1 permintaan pengrajin dari <strong className="text-tenunara-charcoal">Yogyakarta</strong>
                  &nbsp;(Kebutuhan: min. 50 kg)
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

      {/* ─── Testimoni UMKM ─── */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tenunara-mint px-4 py-1 text-[10px] font-bold tracking-wider text-tenunara-teal uppercase">
              <Star className="h-3 w-3 text-tenunara-terracotta" fill="#9C4A3C" />
              Testimoni UMKM
            </span>
            <h2 className="font-heading mt-3 text-2xl font-bold text-tenunara-charcoal md:text-3xl">
              Yang Mereka <span className="text-tenunara-terracotta">Rasakan</span>
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote: "Dulu sisa kain numpuk di gudang, sekarang jadi pemasukan tambahan. TENUNARA bantu kami jual limbah ke pengrajin yang benar-benar butuh.",
                name: "Sari Dewi",
                role: "Pemilik Konveksi &mdash; Bandung",
                icon: Store,
              },
              {
                quote: "Sebagai pengrajin kecil, beli kain baru mahal banget. Di TENUNARA saya dapet Grade A cuma 60% dari harga baru. Kualitasnya ga kalah!",
                name: "Agus Prasetyo",
                role: "Pengrajin Tas Kulit &mdash; Yogyakarta",
                icon: Users,
              },
              {
                quote: "AI grading-nya bener-bener membantu. Ga perlu takut tertipu soal kualitas barang. Tinggal foto, langsung tau Grade A, B, atau C.",
                name: "Rina Wulandari",
                role: "Owner Konveksi &mdash; Solo",
                icon: Store,
              },
            ].map((testi, i) => (
              <div
                key={i}
                className="rounded-3xl border border-tenunara-charcoal/[0.06] bg-tenunara-canvas p-6 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-tenunara-mint text-tenunara-terracotta">
                  <testi.icon className="h-4 w-4" />
                </span>
                <p className="mt-4 text-[13px] italic leading-relaxed text-tenunara-teal">
                  &ldquo;{testi.quote}&rdquo;
                </p>
                <div className="mt-4 border-t border-tenunara-charcoal/[0.06] pt-3">
                  <p className="text-sm font-semibold text-tenunara-charcoal">{testi.name}</p>
                  <p className="text-[11px] text-tenunara-teal" dangerouslySetInnerHTML={{ __html: testi.role }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="bg-tenunara-charcoal">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center md:py-20">
          <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
            Siap Jadi Bagian dari Gerakan Tekstil Sirkular Indonesia?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/60">
            Bergabung gratis. Baik Anda UMKM konveksi dengan limbah kain melimpah, atau pengrajin lokal yang butuh bahan baku murah — di TENUNARA, kita saling bantu.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-tenunara-terracotta px-8 py-4 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(156,74,60,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(156,74,60,0.5)]"
          >
            Gabung Gratis Sekarang
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-tenunara-charcoal/[0.06] bg-white py-6 text-center">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 md:flex-row md:justify-between md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="TENUNARA"
              width={100}
              height={28}
              className="h-6 w-auto object-contain opacity-60"
            />
          </Link>
          <p className="text-[11px] text-tenunara-teal/60">
            &copy; {new Date().getFullYear()} TENUNARA &mdash; Ekonomi Sirkular buat UMKM Tekstil Indonesia
          </p>
        </div>
      </footer>
    </div>
  )
}
