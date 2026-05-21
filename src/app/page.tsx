import Link from "next/link"
import { ArrowRight, Camera, Search, Shirt, ShieldCheck, Leaf, Recycle, BarChart3 } from "lucide-react"

const HOW_IT_WORKS = [
  {
    icon: Camera,
    title: "Upload Foto",
    description: "Foto limbah kain Anda, AI akan langsung menganalisis material, warna, dan ukuran secara otomatis.",
  },
  {
    icon: Search,
    title: "AI Menganalisis & Mencocokkan",
    description: "Sistem AI memberi grade kualitas dan mencocokkan dengan kebutuhan pengrajin yang tepat.",
  },
  {
    icon: Shirt,
    title: "Cari Material yang Tepat",
    description: "Cari limbah kain berdasarkan material, warna, grade, dan jumlah yang dibutuhkan.",
  },
  {
    icon: ShieldCheck,
    title: "Transaksi Aman & Escrow",
    description: "Dana ditahan sistem hingga barang diterima dan diverifikasi oleh pembeli.",
  },
]

const IMPACT_STATS = [
  { icon: Recycle, value: "500+", label: "Kg Limbah Tersalurkan" },
  { icon: Leaf, value: "3.400", label: "Kg CO₂ Dihemat" },
  { icon: BarChart3, value: "57", label: "Setara Pohon Ditanam" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-tenunara-canvas">
      {/* Navbar */}
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-tenunara-terracotta">◈</span>
          <span className="text-lg font-bold text-tenunara-charcoal">TENUNARA</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-tenunara-teal transition-colors duration-200 hover:bg-tenunara-mint/50"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-tenunara-terracotta px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-tenunara-terracotta/90"
          >
            Daftar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 md:px-8 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-tenunara-mint px-4 py-1.5 text-xs font-semibold text-tenunara-teal">
            Ekonomi Sirkular untuk Tekstil Indonesia
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-tenunara-charcoal md:text-5xl lg:text-6xl">
            Ubah Limbah Kain Jadi
            <span className="text-tenunara-terracotta"> Bernilai Ekonomi</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-tenunara-teal md:text-lg">
            Platform circular economy yang menghubungkan UMKM konveksi dengan pengrajin lokal.
            AI kami mengidentifikasi, menggrade, dan mencocokkan limbah tekstil secara otomatis.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register?role=seller"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-tenunara-terracotta px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-tenunara-terracotta/90 hover:shadow-md sm:w-auto"
            >
              Mulai sebagai UMKM
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register?role=buyer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-tenunara-terracotta/30 px-8 py-3.5 text-sm font-semibold text-tenunara-terracotta transition-all duration-200 hover:bg-tenunara-terracotta/5 sm:w-auto"
            >
              Mulai sebagai Pengrajin
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Stats — Tekstil industry context */}
      <section className="mx-auto max-w-5xl px-4 pb-16 md:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm md:p-10">
          <div className="grid gap-8 sm:grid-cols-3">
            {IMPACT_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-tenunara-mint text-tenunara-terracotta">
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-3xl font-bold text-tenunara-charcoal">{stat.value}</p>
                <p className="mt-1 text-sm text-tenunara-teal">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <h2 className="text-center text-2xl font-bold text-tenunara-charcoal md:text-3xl">
          Bagaimana Cara Kerjanya?
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-tenunara-teal">
          Empat langkah mudah untuk memulai ekonomi sirkular tekstil
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-3xl bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Step number */}
              <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-tenunara-terracotta text-sm font-bold text-white">
                {i + 1}
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tenunara-mint text-tenunara-terracotta">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-tenunara-charcoal">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tenunara-teal">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-tenunara-charcoal">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center md:py-20">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Siap Berkontribusi?
          </h2>
          <p className="mt-3 text-sm text-white/70 md:text-base">
            Bergabung dengan ekosistem tekstil berkelanjutan. Kurangi limbah, hemat biaya, dan
            dapatkan data ESG untuk bisnis Anda.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-tenunara-terracotta px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-tenunara-terracotta/90 hover:shadow-md"
          >
            Daftar Sekarang
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-6 text-center text-xs text-tenunara-teal/60">
        <p>&copy; {new Date().getFullYear()} TENUNARA. Dibuat untuk hackathon.</p>
      </footer>
    </div>
  )
}
