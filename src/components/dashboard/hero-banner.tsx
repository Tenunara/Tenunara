"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

interface HeroSlide {
  tag: string
  title: string
  description: string
  cta: string
  image: string
  overlay?: string
}

const SLIDES: HeroSlide[] = [
  {
    tag: "✦ Promo UMKM",
    title: "Grade A Mulai\nRp 15.000/kg",
    description: "Dapatkan limbah kain denim & katun kualitas premium dari UMKM konveksi terpercaya di seluruh Indonesia.",
    cta: "Lihat Katalog",
    image: "https://wlbrqeheezylqqkpgxra.supabase.co/storage/v1/object/public/product-images/50028-ilustrasi-umkm.jpg",
    overlay: "from-black/70 via-black/40 to-black/10",
  },
  {
    tag: "✨ Kreativitas Tanpa Batas",
    title: "Grade B & C\nMulai Rp 6.000/kg",
    description: "Kain ekonomis untuk proyek kreatif Anda. Cocok untuk eksperimen, prototyping, dan produk inovatif lainnya.",
    cta: "Lihat Promo",
    image: "https://wlbrqeheezylqqkpgxra.supabase.co/storage/v1/object/public/product-images/images%20(1).jpg",
    overlay: "from-black/70 via-black/45 to-black/15",
  },
  {
    tag: "🌱 Gabung Jadi Mitra",
    title: "Jual Limbah Kain,\nDapatkan Untung",
    description: "UMKM konveksi bisa jual sisa kain produksi di TENUNARA. Raih keuntungan tambahan sambil berkontribusi untuk lingkungan.",
    cta: "Daftar Sekarang",
    image: "https://wlbrqeheezylqqkpgxra.supabase.co/storage/v1/object/public/product-images/images%20(2).jpg",
    overlay: "from-black/75 via-black/45 to-black/15",
  },
]

export function HeroBanner() {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), [])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  const slide = SLIDES[current]

  return (
    <div className="relative min-h-[200px] overflow-hidden rounded-2xl cursor-pointer">
      <Image
        src={slide.image}
        alt="Banner Tenunara"
        fill
        className="object-cover object-center"
        priority={current === 0}
        quality={90}
        sizes="(min-width: 1280px) 1280px, (min-width: 1024px) 1024px, (min-width: 768px) 90vw, 100vw"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-r ${slide.overlay ?? "from-black/70 via-black/40 to-black/10"}`}
        aria-hidden="true"
      />

      <div className="relative flex items-center justify-between px-6 py-8 md:px-10 md:py-10">
        <div className="max-w-[55%]">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
            {slide.tag}
          </span>
          <h2 className="mt-3 font-heading text-xl font-bold leading-tight text-white md:text-2xl">
            {slide.title.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </h2>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/70 md:text-sm">
            {slide.description}
          </p>
          <button className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-tenunara-terracotta px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-tenunara-terracotta/90 md:text-sm">
            {slide.cta}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Visual pattern */}
        <div className="hidden h-28 w-28 overflow-hidden rounded-xl border border-white/10 bg-white/5 md:block">
          <div
            className="h-full w-full opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.06) 3px,rgba(255,255,255,0.06) 4px),repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(255,255,255,0.06) 3px,rgba(255,255,255,0.06) 4px)",
            }}
          />
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-white" : "w-2 bg-white/35"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
