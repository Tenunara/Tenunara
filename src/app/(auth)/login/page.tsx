"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// TODO: Replace alerts with toast notifications (sonner)
// import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with real Supabase signInWithPassword
      // const { error } = await supabase.auth.signInWithPassword({ email, password })
      // if (error) throw error
      // router.push('/dashboard')

      // Mock login: simulate delay then redirect
      await new Promise((r) => setTimeout(r, 800))
      router.push("/dashboard")
    } catch {
      setError("Email atau password salah")
      // toast.error("Email atau password salah")
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (role: "seller" | "buyer") => {
    setLoading(true)
    setError(null)

    // TODO: Replace with actual demo credentials from Supabase or env
    await new Promise((r) => setTimeout(r, 500))
    router.push("/dashboard")
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-tenunara-charcoal">Masuk</h1>
        <p className="mt-1 text-center text-sm text-tenunara-teal">Masuk ke akun TENUNARA Anda</p>

        {/* Demo quick-login buttons — like Tokopedia's social login */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleDemoLogin("seller")}
            disabled={loading}
            className="flex flex-col items-center gap-1 rounded-xl border border-border px-4 py-3 text-center transition-colors duration-200 hover:bg-tenunara-mint/50 disabled:opacity-50"
          >
            <span className="text-lg">🏭</span>
            <span className="text-xs font-semibold text-tenunara-charcoal">Demo UMKM</span>
            <span className="text-[10px] text-tenunara-teal/60">seller@tenunara.demo</span>
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin("buyer")}
            disabled={loading}
            className="flex flex-col items-center gap-1 rounded-xl border border-border px-4 py-3 text-center transition-colors duration-200 hover:bg-tenunara-mint/50 disabled:opacity-50"
          >
            <span className="text-lg">🧵</span>
            <span className="text-xs font-semibold text-tenunara-charcoal">Demo Pengrajin</span>
            <span className="text-[10px] text-tenunara-teal/60">buyer@tenunara.demo</span>
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-tenunara-teal/60">atau</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
                autoComplete="current-password"
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
          </div>

          {error && (
            <p className="text-xs font-medium text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-tenunara-terracotta py-3 text-sm font-semibold text-white hover:bg-tenunara-terracotta/90"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </span>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-tenunara-teal">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-tenunara-terracotta hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  )
}
