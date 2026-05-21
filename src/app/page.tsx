"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Quote,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ─── Data ─── */

const NAV_LINKS = [
  { label: "Pasar Material", href: "/dashboard/browse" },
  { label: "Cara Kerja", href: "#features" },
  { label: "Dampak", href: "#dampak" },
];

const TRUST_BADGES = [
  { label: "Gratis Daftar untuk UMKM", icon: Check },
  { label: "AI Grading Otomatis", icon: ScanLine },
  { label: "Pembayaran Escrow Aman", icon: ShieldCheck },
];

const METRICS = [
  {
    number: 10,
    suffix: "+ Ton",
    description: "Target pengalihan limbah tekstil dari TPA, tahun pertama",
  },
  {
    number: 20,
    suffix: "%",
    description: "Rata-rata efisiensi biaya bahan baku pengrajin lokal",
  },
  {
    number: 500,
    suffix: "+",
    description: "UMKM konveksi dan pengrajin yang bergabung di ekosistem TENUNARA",
  },
];

const FEATURES = [
  {
    icon: ScanLine,
    title: "AI Grading untuk Hasil Maksimal",
    description:
      "Cukup foto sisa kain produksi Anda. AI TENUNARA langsung mendeteksi jenis bahan, warna, ukuran, dan memberikan grade A/B/C secara otomatis — tanpa perlu keahlian teknis.",
  },
  {
    icon: GitMerge,
    title: "Pencocokan Cerdas ala Indonesia",
    description:
      "NLP yang paham konteks lokal. Cari 'jins' dapet 'denim', cari 'kain putih' muncul 'katun putih'. Cocok untuk UMKM yang ga mau ribet dengan kata kunci rumit.",
  },
  {
    icon: ShieldCheck,
    title: "Transaksi Aman & Terpercaya",
    description:
      "Sistem escrow + pemeriksaan fisik 3 hari. Kalau barang ga sesuai, uang kembali. Biar UMKM dan pengrajin sama-sama tenang bertransaksi.",
  },
  {
    icon: BarChart3,
    title: "Dasbor Kepatuhan & ESG",
    description:
      "Pantau volume limbah yang teralihkan dari TPA secara real-time. Data siap pakai buat laporan ESG perusahaan — bikin branding hijau UMKM Anda naik kelas.",
  },
];

const DAERAH_UMKM = [
  { kota: "Bandung", jumlah: "120+", icon: MapPin },
  { kota: "Jakarta", jumlah: "85+", icon: MapPin },
  { kota: "Yogyakarta", jumlah: "60+", icon: MapPin },
  { kota: "Solo", jumlah: "45+", icon: MapPin },
  { kota: "Bogor", jumlah: "40+", icon: MapPin },
];

const TESTIMONIALS = [
  {
    quote:
      "Dulu sisa kain numpuk di gudang, sekarang jadi pemasukan tambahan. TENUNARA bantu kami jual limbah ke pengrajin yang benar-benar butuh.",
    name: "Sari Dewi",
    role: "Pemilik Konveksi — Bandung",
    icon: Store,
  },
  {
    quote:
      "Sebagai pengrajin kecil, beli kain baru mahal banget. Di TENUNARA saya dapet Grade A cuma 60% dari harga baru. Kualitasnya ga kalah!",
    name: "Agus Prasetyo",
    role: "Pengrajin Tas Kulit — Yogyakarta",
    icon: Users,
  },
  {
    quote:
      "AI grading-nya bener-bener membantu. Ga perlu takut tertipu soal kualitas barang. Tinggal foto, langsung tau Grade A, B, atau C.",
    name: "Rina Wulandari",
    role: "Owner Konveksi — Solo",
    icon: Store,
  },
];

/* ─── Hook: scroll reveal ─── */

function useScrollReveal() {
  useEffect(() => {
    const cb: IntersectionObserverCallback = (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("revealed");
      });
    };
    const o = new IntersectionObserver(cb, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    const els = document.querySelectorAll("[data-reveal], [data-stagger]");
    els.forEach((el) => o.observe(el));
    return () => o.disconnect();
  }, []);
}

/* ─── Hook: smooth counter ─── */

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const o = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          o.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);

  useEffect(() => {
    if (!revealed) return;
    const el = ref.current;
    if (!el) return;
    const num = target;
    const duration = 1200;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      el.textContent = Math.floor(eased * num) + suffix;
      if (t < 1) raf = requestAnimationFrame(tick);
      else el.textContent = num + suffix;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [revealed, target, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

/* ─── Page ─── */

export default function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const prevTestimonial = () =>
    setActiveTestimonial((p) => (p === 0 ? TESTIMONIALS.length - 1 : p - 1));
  const nextTestimonial = () =>
    setActiveTestimonial((p) => (p === TESTIMONIALS.length - 1 ? 0 : p + 1));

  return (
    <div className="min-h-screen bg-tenunara-canvas font-body">
      {/* ─── Navbar ─── */}
      <nav
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/85 shadow-[0_1px_20px_rgba(85,67,63,0.08)] backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
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

          <div className="hidden items-center gap-8 lg:flex">
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
              className="hidden text-sm font-semibold text-tenunara-teal transition-colors hover:text-tenunara-charcoal sm:block"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-tenunara-terracotta px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(156,74,60,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-tenunara-terracotta/90 hover:shadow-[0_8px_28px_rgba(156,74,60,0.45)]"
            >
              Daftar Sebagai Mitra
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-[90vh] overflow-hidden pt-16">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-tenunara-canvas via-tenunara-canvas to-white" />
        <div className="grain-bg absolute inset-0" />

        {/* Decorative elements – floating organic shapes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Large orb – top right */}
          <div className="animate-orb absolute -top-24 -right-24 h-96 w-96 rounded-full bg-tenunara-terracotta/8 blur-[80px]" />
          {/* Medium orb – bottom left */}
          <div className="animate-orb-delayed absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-tenunara-teal/8 blur-[70px]" />
          {/* Small accent */}
          <div className="animate-orb-slow absolute top-1/3 left-1/4 h-40 w-40 rounded-full bg-tenunara-mint/40 blur-[50px]" />
          {/* Weave grid overlay */}
          <div className="weave-pattern absolute inset-0 opacity-60" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(90vh-4rem)] max-w-7xl flex-col items-center gap-12 px-5 pb-20 pt-12 md:flex-row md:px-8 md:pt-16">
          {/* ─── Hero Text ─── */}
          <div className="flex-1 text-center md:text-left" data-reveal>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-tenunara-terracotta/20 bg-white/60 px-4 py-1.5 text-[11px] font-bold tracking-wider text-tenunara-terracotta uppercase backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Ekosistem Tekstil Sirkular #BuatIndonesia
            </span>

            <h1 className="font-heading mt-7 text-[clamp(2.4rem,7vw,4.4rem)] leading-[1.05] font-light text-tenunara-charcoal">
              <span className="inline-block">Limbah Kain UMKM?</span>
              <br />
              <strong className="font-bold">Jangan Dibuang,</strong>
              <br />
              <span className="bg-gradient-to-r from-tenunara-terracotta to-tenunara-charcoal bg-clip-text text-transparent">
                Dijual ke Sesama Pengrajin.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-tenunara-teal md:mx-0">
              TENUNARA adalah pasar digital{" "}
              <strong className="font-semibold text-tenunara-charcoal">
                khusus UMKM Indonesia
              </strong>{" "}
              yang menghubungkan konveksi dengan limbah kain melimpah — ke
              pengrajin lokal yang butuh bahan baku murah berkualitas. Semua
              berkat AI pencocokan buatan anak bangsa.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                href="/register?role=seller"
                className="group inline-flex items-center gap-2 rounded-xl bg-tenunara-terracotta px-7 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(156,74,60,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(156,74,60,0.4)]"
              >
                Saya Mau Jual Limbah Kain
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/dashboard/browse"
                className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-tenunara-teal/30 px-7 py-3.5 text-sm font-semibold text-tenunara-teal transition-all duration-200 hover:border-tenunara-teal/60 hover:bg-tenunara-mint/30"
              >
                Saya Cari Bahan Baku
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap justify-center gap-5 md:justify-start">
              {TRUST_BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 text-xs font-medium text-tenunara-teal"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-tenunara-mint text-tenunara-terracotta">
                    <badge.icon className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  {badge.label}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Hero Visual ─── */}
          <div
            className="relative flex w-full max-w-md flex-1 items-center justify-center md:max-w-none"
            data-reveal="right"
          >
            {/* Card mockup */}
            <div className="group relative w-full max-w-sm">
              {/* Glow behind */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-tenunara-terracotta/15 via-tenunara-teal/5 to-transparent opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

              <div className="relative overflow-hidden rounded-2xl border border-tenunara-charcoal/[0.06] bg-white shadow-[0_8px_40px_rgba(85,67,63,0.1)]">
                {/* Card header */}
                <div className="flex items-center justify-between border-b border-tenunara-charcoal/[0.06] bg-tenunara-canvas/40 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-tenunara-charcoal">
                    <ScanLine className="h-3.5 w-3.5 text-tenunara-terracotta" />
                    AI Grading
                  </div>
                  <span className="animate-pulse-badge rounded-md bg-tenunara-terracotta px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
                    ● Live
                  </span>
                </div>

                {/* Card body */}
                <div className="p-4">
                  {/* Fabric swatches */}
                  <div className="flex gap-2">
                    <div className="h-20 w-16 rounded-lg bg-gradient-to-br from-tenunara-terracotta/70 to-tenunara-charcoal/50 shadow-inner" />
                    <div className="h-20 w-16 rounded-lg bg-gradient-to-br from-tenunara-teal/60 to-tenunara-mint/70 shadow-inner" />
                    <div className="h-20 w-16 rounded-lg bg-gradient-to-br from-tenunara-charcoal/50 to-tenunara-canvas/80 shadow-inner" />
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-tenunara-teal/20 text-[10px] text-tenunara-teal">
                      +3 lainnya
                    </div>
                  </div>

                  {/* Result line */}
                  <div className="mt-3 space-y-1.5 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-tenunara-teal">Bahan Terdeteksi</span>
                      <span className="font-semibold text-tenunara-charcoal">
                        Denim, Katun, Polyester
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-tenunara-teal">Grade Rata-rata</span>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        Grade B — Layak Jual
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-tenunara-teal">Estimasi Nilai</span>
                      <span className="font-semibold text-tenunara-charcoal">
                        Rp 45.000 – 85.000 / kg
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-tenunara-canvas">
                    <div className="h-full w-3/4 animate-shimmer rounded-full bg-gradient-to-r from-tenunara-terracotta via-tenunara-teal to-tenunara-terracotta" />
                  </div>
                  <p className="mt-1 text-right text-[10px] text-tenunara-teal/60">
                    Menganalisis 6 batch...
                  </p>
                </div>
              </div>

              {/* Floating badge */}
              <div className="animate-float-slow absolute -right-4 -bottom-3 rounded-xl border border-tenunara-mint bg-white px-3 py-2 shadow-lg">
                <p className="text-[10px] font-bold text-tenunara-charcoal">
                  <span className="text-tenunara-terracotta">↗</span> 98%
                </p>
                <p className="text-[8px] text-tenunara-teal">akurasi grading</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Wave divider ─── */}
      <div className="relative h-16 md:h-24">
        <svg
          className="absolute bottom-0 w-full"
          viewBox="0 0 1440 80"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 40Q180 0 360 30T720 20T1080 35T1440 25V80H0V40Z"
            fill="white"
          />
        </svg>
      </div>

      {/* ─── Metrics ─── */}
      <section id="dampak" className="bg-white px-5 pb-20 md:px-8">
        <div
          className="mx-auto max-w-5xl rounded-3xl border border-tenunara-charcoal/[0.06] bg-gradient-to-br from-white to-tenunara-canvas/30 px-8 py-12 shadow-[0_8px_30px_rgba(85,67,63,0.08)] md:px-14 md:py-14"
          data-reveal
        >
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-0">
            {METRICS.map((metric, i) => (
              <div
                key={metric.description}
                className={`text-center ${i > 0 ? "sm:border-l sm:border-tenunara-charcoal/[0.08] sm:pl-8" : ""}`}
              >
                <p className="font-heading text-[clamp(2.8rem,6vw,4.5rem)] font-bold leading-none text-tenunara-charcoal">
                  <AnimatedCounter target={metric.number} suffix={metric.suffix} />
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
      <section className="bg-tenunara-canvas/60 pb-20 pt-10">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="text-center" data-reveal>
            <h2 className="font-heading text-2xl font-bold text-tenunara-charcoal md:text-3xl">
              UMKM dari Seluruh{" "}
              <span className="text-tenunara-terracotta">Nusantara</span>
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-tenunara-teal">
              Dari Bandung sampai Makassar — konveksi dan pengrajin sudah
              bergabung di ekosistem TENUNARA
            </p>
          </div>

          <div
            className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5"
            data-stagger
          >
            {DAERAH_UMKM.map((daerah) => (
              <div
                key={daerah.kota}
                className="rounded-2xl border border-tenunara-charcoal/[0.06] bg-white px-4 py-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_8px_24px_rgba(85,67,63,0.1)]"
              >
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-tenunara-mint text-tenunara-terracotta">
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

      {/* ─── Features ─── */}
      <section id="features" className="relative overflow-hidden bg-white pb-24 pt-20">
        {/* Background accent */}
        <div className="pointer-events-none absolute -top-40 right-0 h-80 w-80 rounded-full bg-tenunara-mint/30 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
          <div className="text-center" data-reveal>
            <h2 className="font-heading text-2xl font-bold text-tenunara-charcoal md:text-3xl">
              Kenapa UMKM{" "}
              <span className="text-tenunara-terracotta">Pilih</span> TENUNARA?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-tenunara-teal">
              Teknologi AI yang memudahkan, bukan mempersulit. Dibuat khusus
              buat kebutuhan UMKM tekstil Indonesia.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2" data-stagger>
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className={`group rounded-3xl border border-tenunara-charcoal/[0.06] p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(85,67,63,0.1)] ${
                  i === 0 ? "bg-tenunara-canvas" : "bg-white"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tenunara-mint text-tenunara-terracotta transition-transform duration-300 group-hover:scale-110">
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
      <section className="relative overflow-hidden py-20">
        {/* Background */}
        <div className="grain-bg absolute inset-0 bg-gradient-to-b from-tenunara-mint/20 via-white to-tenunara-mint/10" />
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-orb absolute top-20 left-10 h-60 w-60 rounded-full bg-tenunara-terracotta/6 blur-[60px]" />
          <div className="animate-orb-delayed absolute bottom-10 right-10 h-72 w-72 rounded-full bg-tenunara-teal/6 blur-[60px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
          <div className="text-center" data-reveal>
            <h2 className="font-heading text-2xl font-bold text-tenunara-charcoal md:text-3xl">
              Lihat AI Kami{" "}
              <span className="bg-gradient-to-r from-tenunara-terracotta to-tenunara-teal bg-clip-text text-transparent">
                Bekerja
              </span>
            </h2>
            <p className="mt-2 text-sm text-tenunara-teal">
              Simulasi real-time — tinggal foto, AI kami urus sisanya
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2" data-reveal>
            {/* Scan visual */}
            <div className="relative h-72 overflow-hidden rounded-3xl bg-gradient-to-br from-[#4a6b7a] via-[#2d4a5a] to-[#3a5a6a] shadow-[0_8px_30px_rgba(45,74,90,0.3)] md:h-96">
              <div className="weave-pattern absolute inset-0 opacity-30" />
              <div className="animate-orb absolute -top-16 -right-16 h-48 w-48 rounded-full bg-tenunara-terracotta/20 blur-[50px]" />
              <div className="animate-orb-delayed absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-tenunara-mint/15 blur-[50px]" />

              {/* Corner brackets */}
              <div className="absolute top-6 left-6 h-10 w-10 border-t-2 border-l-2 border-tenunara-terracotta/70" />
              <div className="absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 border-tenunara-terracotta/70" />
              {/* Scan line */}
              <div className="scan-line" />
              <span className="animate-pulse-badge absolute top-4 right-4 rounded-md bg-tenunara-terracotta/90 px-3 py-1 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
                ● Live Scan
              </span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <ScanLine className="mx-auto h-10 w-10 text-white/20" />
                  <p className="mt-2 text-sm font-medium text-white/30">
                    Arahkan kamera ke sisa kain
                  </p>
                </div>
              </div>
            </div>

            {/* Scorecard */}
            <div className="rounded-3xl border border-tenunara-charcoal/[0.08] bg-white p-7 shadow-[0_4px_20px_rgba(85,67,63,0.08)] backdrop-blur-sm md:p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-tenunara-charcoal">
                  Hasil Analisis AI
                </h3>
                <span className="rounded-full bg-tenunara-canvas px-3 py-1 text-[10px] font-medium text-tenunara-teal">
                  Baru saja
                </span>
              </div>

              <div className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-[13px]">
                <span className="text-tenunara-teal">Jenis Bahan</span>
                <span className="font-semibold text-tenunara-charcoal">
                  Denim Biru Potongan (&gt;30 cm)
                </span>
                <span className="text-tenunara-teal">Kualitas</span>
                <span className="font-semibold text-tenunara-charcoal">
                  120 PPI — Layak Pakai
                </span>
                <span className="text-tenunara-teal">Estimasi Berat</span>
                <span className="font-semibold text-tenunara-charcoal">
                  180 GSM
                </span>
              </div>

              {/* Grade badge */}
              <div className="mt-6 border-t border-tenunara-charcoal/[0.08] pt-5">
                <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold tracking-wide text-green-700 uppercase">
                  Grade B — Layak Jual
                </span>
              </div>

              {/* Match */}
              <div className="mt-5 rounded-2xl border border-tenunara-charcoal/[0.06] bg-tenunara-canvas/60 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-tenunara-terracotta" />
                  <div>
                    <p className="text-[11px] font-semibold text-tenunara-charcoal">
                      Cocok dengan:
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-tenunara-teal">
                      1 permintaan pengrajin dari{" "}
                      <strong className="text-tenunara-charcoal">
                        Yogyakarta
                      </strong>{" "}
                      (Kebutuhan: min. 50 kg)
                    </p>
                    <Link
                      href="/dashboard/browse"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-tenunara-terracotta/30 px-4 py-2 text-[11px] font-semibold text-tenunara-terracotta transition-all hover:bg-tenunara-terracotta/5 hover:gap-2"
                    >
                      Lihat Detail Permintaan
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="text-center" data-reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-tenunara-terracotta/15 bg-tenunara-mint/50 px-4 py-1 text-[10px] font-bold tracking-wider text-tenunara-teal uppercase backdrop-blur-sm">
              <Star className="h-3 w-3 text-tenunara-terracotta" fill="#9C4A3C" />
              Testimoni UMKM
            </span>
            <h2 className="font-heading mt-3 text-2xl font-bold text-tenunara-charcoal md:text-3xl">
              Yang Mereka{" "}
              <span className="text-tenunara-terracotta">Rasakan</span>
            </h2>
          </div>

          {/* Carousel */}
          <div className="relative mt-10" data-reveal>
            <div className="overflow-hidden rounded-3xl border border-tenunara-charcoal/[0.06] bg-tenunara-canvas/50">
              <div className="relative p-8 md:p-12">
                {/* Quote mark */}
                <Quote className="absolute top-6 left-8 h-10 w-10 text-tenunara-terracotta/10 md:left-12" />

                <div className="relative z-10">
                  <p className="text-[15px] italic leading-relaxed text-tenunara-teal md:text-[17px]">
                    &ldquo;{TESTIMONIALS[activeTestimonial].quote}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-tenunara-mint text-tenunara-terracotta shadow-sm">
                      {(() => {
                        const Icon = TESTIMONIALS[activeTestimonial].icon;
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-tenunara-charcoal">
                        {TESTIMONIALS[activeTestimonial].name}
                      </p>
                      <p className="text-[12px] text-tenunara-teal">
                        {TESTIMONIALS[activeTestimonial].role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={prevTestimonial}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-tenunara-charcoal/[0.12] bg-white text-tenunara-teal shadow-sm transition-all hover:border-tenunara-terracotta/30 hover:text-tenunara-terracotta hover:shadow-md"
                aria-label="Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeTestimonial
                        ? "w-6 bg-tenunara-terracotta"
                        : "w-2 bg-tenunara-teal/20 hover:bg-tenunara-teal/40"
                    }`}
                    aria-label={`Testimoni ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-tenunara-charcoal/[0.12] bg-white text-tenunara-teal shadow-sm transition-all hover:border-tenunara-terracotta/30 hover:text-tenunara-terracotta hover:shadow-md"
                aria-label="Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden bg-tenunara-charcoal">
        {/* Decorative */}
        <div className="pointer-events-none absolute inset-0">
          <div className="weave-pattern absolute inset-0 opacity-[0.07]" />
          <div className="animate-orb absolute -top-32 -right-32 h-96 w-96 rounded-full bg-tenunara-terracotta/10 blur-[100px]" />
          <div className="animate-orb-delayed absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/5 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-5 py-20 text-center md:py-28" data-reveal>
          <Leaf className="mx-auto h-8 w-8 text-tenunara-mint/40" />
          <h2 className="font-heading mt-6 text-2xl font-bold text-white md:text-4xl">
            Siap Jadi Bagian dari{" "}
            <span className="text-tenunara-terracotta">Gerakan Tekstil Sirkular</span>{" "}
            Indonesia?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/50">
            Bergabung gratis. Baik Anda UMKM konveksi dengan limbah kain
            melimpah, atau pengrajin lokal yang butuh bahan baku murah — di
            TENUNARA, kita saling bantu.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-tenunara-terracotta px-8 py-4 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(156,74,60,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(156,74,60,0.5)] group"
          >
            Gabung Gratis Sekarang
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-tenunara-charcoal/[0.06] bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-5 md:flex-row md:justify-between md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="TENUNARA"
              width={100}
              height={28}
              className="h-6 w-auto object-contain opacity-50"
            />
          </Link>
          <p className="text-[11px] text-tenunara-teal/50">
            &copy; {new Date().getFullYear()} TENUNARA &mdash; Ekonomi Sirkular
            buat UMKM Tekstil Indonesia
          </p>
        </div>
      </footer>
    </div>
  );
}
