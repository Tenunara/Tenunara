"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function setAuthCookie(token: string, maxAge: number = 3600) {
  document.cookie = `sb-access-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already logged in with valid token
  useEffect(() => {
    const token = localStorage.getItem("sb-access-token");
    if (!token) return;

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) {
          setAuthCookie(token);
          router.push("/dashboard");
        } else {
          localStorage.removeItem("sb-access-token");
          localStorage.removeItem("sb-refresh-token");
          localStorage.removeItem("sb-user-role");
          localStorage.removeItem("sb-user-id");
          clearAuthCookie();
        }
      })
      .catch(() => {
        // Network error — stay on login page
      });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk");
      }

      // Store access token for Bearer auth
      localStorage.setItem("sb-access-token", data.session.access_token);
      localStorage.setItem("sb-refresh-token", data.session.refresh_token);
      localStorage.setItem("sb-user-role", data.user.role);
      localStorage.setItem("sb-user-id", data.user.id);

      // Set cookie for middleware (server-side auth check)
      setAuthCookie(data.session.access_token);

      toast.success("Berhasil masuk");
      router.push(redirect);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: "pengrajin" | "umkm") => {
    setLoading(true);
    setError(null);

    const demoAccounts: Record<string, { email: string; password: string }> = {
      pengrajin: { email: "pengrajin@email.com", password: "password123" },
      umkm: { email: "umkm@email.com", password: "password123" },
    };

    try {
      const demo = demoAccounts[role];
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demo),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal login demo");
      }

      localStorage.setItem("sb-access-token", data.session.access_token);
      localStorage.setItem("sb-refresh-token", data.session.refresh_token);
      localStorage.setItem("sb-user-role", data.user.role);
      localStorage.setItem("sb-user-id", data.user.id);

      setAuthCookie(data.session.access_token);

      toast.success("Berhasil masuk (demo)");
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-tenunara-charcoal">
          Masuk
        </h1>
        <p className="mt-1 text-center text-sm text-tenunara-teal">
          Masuk ke akun TENUNARA Anda
        </p>

        {/* Demo quick-login buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleDemoLogin("umkm")}
            disabled={loading}
            className="flex flex-col items-center gap-1 rounded-xl border border-border px-4 py-3 text-center transition-colors duration-200 hover:bg-tenunara-mint/50 disabled:opacity-50"
          >
            <span className="text-lg">🏭</span>
            <span className="text-xs font-semibold text-tenunara-charcoal">
              Demo UMKM
            </span>
            <span className="text-[10px] text-tenunara-teal/60">
              umkm@email.com
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleDemoLogin("pengrajin")}
            disabled={loading}
            className="flex flex-col items-center gap-1 rounded-xl border border-border px-4 py-3 text-center transition-colors duration-200 hover:bg-tenunara-mint/50 disabled:opacity-50"
          >
            <span className="text-lg">🧵</span>
            <span className="text-xs font-semibold text-tenunara-charcoal">
              Demo Pengrajin
            </span>
            <span className="text-[10px] text-tenunara-teal/60">
              pengrajin@email.com
            </span>
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
                placeholder="Min. 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tenunara-teal/60 hover:text-tenunara-teal"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
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
          <Link
            href="/register"
            className="font-semibold text-tenunara-terracotta hover:underline"
          >
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
