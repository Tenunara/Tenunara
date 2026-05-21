"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// TODO: Replace alerts with toast notifications (sonner)
// import { toast } from "sonner"

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get("role") === "buyer" ? "buyer" : "seller"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"seller" | "buyer">(defaultRole)
  const [company, setCompany] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name || name.length < 3) errs.name = "Nama minimal 3 karakter"
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Format email tidak valid"
    if (!password || password.length < 6) errs.password = "Kata sandi minimal 6 karakter"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    try {
      // TODO: Replace with real Supabase signUp
      // const { error } = await supabase.auth.signUp({ email, password })
      // if (error) throw error
      // Then create profile with name, role, company
      await new Promise((r) => setTimeout(r, 800))
      router.push("/dashboard")
    } catch {
      // toast.error("Gagal mendaftar. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-tenunara-charcoal">Daftar</h1>
        <p className="mt-1 text-center text-sm text-tenunara-teal">Buat akun TENUNARA baru</p>

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          {/* Role selector — toggle style like Tokopedia's buyer/seller switch */}
          <div className="space-y-2">
            <Label>Saya ingin bergabung sebagai</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("seller")}
                className={`rounded-xl border-2 px-4 py-3 text-center text-sm font-semibold transition-all duration-200 ${
                  role === "seller"
                    ? "border-tenunara-terracotta bg-tenunara-terracotta/5 text-tenunara-terracotta"
                    : "border-border text-tenunara-teal hover:border-tenunara-teal/30"
                }`}
              >
                <span className="block text-lg">🏭</span>
                UMKM
                <span className="block text-[10px] font-normal">Penjual</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("buyer")}
                className={`rounded-xl border-2 px-4 py-3 text-center text-sm font-semibold transition-all duration-200 ${
                  role === "buyer"
                    ? "border-tenunara-terracotta bg-tenunara-terracotta/5 text-tenunara-terracotta"
                    : "border-border text-tenunara-teal hover:border-tenunara-teal/30"
                }`}
              >
                <span className="block text-lg">🧵</span>
                Pengrajin
                <span className="block text-[10px] font-normal">Pembeli</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              placeholder="Nama lengkap atau usaha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="contoh@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tenunara-teal/60 hover:text-tenunara-teal"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {role === "seller" && (
            <div className="space-y-2">
              <Label htmlFor="company">
                Nama Perusahaan <span className="text-tenunara-teal/60">(opsional)</span>
              </Label>
              <Input
                id="company"
                placeholder="CV. Contoh Textile"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-tenunara-terracotta py-3 text-sm font-semibold text-white hover:bg-tenunara-terracotta/90"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Mendaftar...
              </span>
            ) : (
              "Daftar"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-tenunara-teal">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-tenunara-terracotta hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-tenunara-terracotta" />
            </div>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
