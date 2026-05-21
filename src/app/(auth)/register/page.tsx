"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const KOTA_OPTIONS = [
  "Jakarta Pusat",
  "Jakarta Utara",
  "Jakarta Barat",
  "Jakarta Selatan",
  "Jakarta Timur",
  "Bandung",
  "Surabaya",
  "Yogyakarta",
  "Semarang",
  "Medan",
  "Makassar",
  "Denpasar",
  "Palembang",
  "Lainnya",
]

const KABUPATEN_OPTIONS = [
  "Kab. Bandung",
  "Kab. Bogor",
  "Kab. Bekasi",
  "Kab. Tangerang",
  "Kab. Depok",
  "Kab. Sleman",
  "Kab. Bantul",
  "Kab. Gresik",
  "Kab. Sidoarjo",
  "Lainnya",
]

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get("role") === "buyer" ? "pengrajin" : "umkm"

  const [role, setRole] = useState<"pengrajin" | "umkm">(defaultRole)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Shared fields
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nomorTelepon, setNomorTelepon] = useState("")
  const [kota, setKota] = useState("")
  const [kabupaten, setKabupaten] = useState("")
  const [alamat, setAlamat] = useState("")

  // Pengrajin-specific
  const [nama, setNama] = useState("")

  // UMKM-specific
  const [namaPenjual, setNamaPenjual] = useState("")
  const [namaToko, setNamaToko] = useState("")
  const [npwpNib, setNpwpNib] = useState("")

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, foto_profil: "File harus berupa gambar" }))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, foto_profil: "Ukuran maksimal 5MB" }))
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setErrors((prev) => {
      const { foto_profil: _, ...rest } = prev
      return rest
    })
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const validate = () => {
    const errs: Record<string, string> = {}

    if (role === "pengrajin") {
      if (!nama || nama.length < 3) errs.nama = "Nama minimal 3 karakter"
    } else {
      if (!namaPenjual || namaPenjual.length < 3) errs.nama_penjual = "Nama penjual minimal 3 karakter"
      if (!namaToko || namaToko.length < 3) errs.nama_toko = "Nama toko minimal 3 karakter"
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Format email tidak valid"
    if (!nomorTelepon || nomorTelepon.length < 8) errs.nomor_telepon = "Nomor telepon minimal 8 digit"
    if (!password || password.length < 8) errs.password = "Kata sandi minimal 8 karakter"
    if (!kota) errs.kota = "Pilih kota"
    if (!kabupaten) errs.kabupaten = "Pilih kabupaten"
    if (!alamat || alamat.length < 5) errs.alamat = "Alamat minimal 5 karakter"

    if (npwpNib && npwpNib.length < 8) errs.npwp_nib = "NPWP/NIB tidak valid"

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    try {
      let foto_profil_base64: string | undefined

      // Convert photo to base64 if selected
      if (photoFile) {
        foto_profil_base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(photoFile)
        })
      }

      const endpoint =
        role === "pengrajin"
          ? "/api/auth/register/pengrajin"
          : "/api/auth/register/umkm"

      const body =
        role === "pengrajin"
          ? { nama, email, nomor_telepon: nomorTelepon, password, kota, kabupaten, alamat, foto_profil_base64 }
          : { nama_penjual: namaPenjual, nama_toko: namaToko, email, nomor_telepon: nomorTelepon, password, kota, kabupaten, alamat, foto_profil_base64, npwp_nib: npwpNib || undefined }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Gagal mendaftar")
      }

      // Store session for auto-login
      if (data.session) {
        localStorage.setItem("sb-access-token", data.session.access_token)
        localStorage.setItem("sb-refresh-token", data.session.refresh_token)
      }
      localStorage.setItem("sb-user-role", role)
      localStorage.setItem("sb-user-id", data.user?.id || "")

      toast.success("Pendaftaran berhasil!")
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mendaftar. Silakan coba lagi."
      setErrors((prev) => ({ ...prev, submit: message }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-tenunara-charcoal">Daftar</h1>
        <p className="mt-1 text-center text-sm text-tenunara-teal">Buat akun TENUNARA baru</p>

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          {/* Role Selector */}
          <div className="space-y-2">
            <Label>Saya ingin bergabung sebagai</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("umkm")}
                className={`rounded-xl border-2 px-4 py-3 text-center text-sm font-semibold transition-all duration-200 ${
                  role === "umkm"
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
                onClick={() => setRole("pengrajin")}
                className={`rounded-xl border-2 px-4 py-3 text-center text-sm font-semibold transition-all duration-200 ${
                  role === "pengrajin"
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

          {/* Common Fields */}
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
            <Label htmlFor="nomor_telepon">Nomor Telepon</Label>
            <Input
              id="nomor_telepon"
              type="tel"
              placeholder="08123456789"
              value={nomorTelepon}
              onChange={(e) => setNomorTelepon(e.target.value)}
              required
            />
            {errors.nomor_telepon && <p className="text-xs text-destructive">{errors.nomor_telepon}</p>}
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

          {/* Role-specific Fields */}
          {role === "pengrajin" ? (
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                placeholder="Nama lengkap pengrajin"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                minLength={3}
              />
              {errors.nama && <p className="text-xs text-destructive">{errors.nama}</p>}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="nama_penjual">Nama Penjual</Label>
                <Input
                  id="nama_penjual"
                  placeholder="Nama pemilik/penjual"
                  value={namaPenjual}
                  onChange={(e) => setNamaPenjual(e.target.value)}
                  required
                  minLength={3}
                />
                {errors.nama_penjual && <p className="text-xs text-destructive">{errors.nama_penjual}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama_toko">Nama Toko</Label>
                <Input
                  id="nama_toko"
                  placeholder="Nama toko UMKM"
                  value={namaToko}
                  onChange={(e) => setNamaToko(e.target.value)}
                  required
                  minLength={3}
                />
                {errors.nama_toko && <p className="text-xs text-destructive">{errors.nama_toko}</p>}
              </div>
            </>
          )}

          {/* Location Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="kota">Kota</Label>
              <Select value={kota} onValueChange={(value) => value && setKota(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kota" />
                </SelectTrigger>
                <SelectContent>
                  {KOTA_OPTIONS.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.kota && <p className="text-xs text-destructive">{errors.kota}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kabupaten">Kabupaten</Label>
              <Select value={kabupaten} onValueChange={(value) => value && setKabupaten(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kabupaten" />
                </SelectTrigger>
                <SelectContent>
                  {KABUPATEN_OPTIONS.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.kabupaten && <p className="text-xs text-destructive">{errors.kabupaten}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat</Label>
            <Textarea
              id="alamat"
              placeholder="Alamat lengkap usaha/tempat produksi"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              required
              rows={3}
            />
            {errors.alamat && <p className="text-xs text-destructive">{errors.alamat}</p>}
          </div>

          {/* Foto Profil */}
          <div className="space-y-2">
            <Label>
              Upload Foto Profil{" "}
              <span className="text-tenunara-teal/60">(opsional)</span>
            </Label>
            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-24 w-24 rounded-2xl object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-tenunara-teal transition-colors hover:border-tenunara-terracotta/50 hover:text-tenunara-terracotta">
                <Upload className="h-4 w-4" />
                Pilih foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            )}
            {errors.foto_profil && <p className="text-xs text-destructive">{errors.foto_profil}</p>}
          </div>

          {/* UMKM: NPWP/NIB */}
          {role === "umkm" && (
            <div className="space-y-2">
              <Label htmlFor="npwp_nib">
                Nomor NPWP / NIB{" "}
                <span className="text-tenunara-teal/60">(opsional)</span>
              </Label>
              <Input
                id="npwp_nib"
                placeholder="Nomor NPWP atau NIB"
                value={npwpNib}
                onChange={(e) => setNpwpNib(e.target.value)}
              />
              {errors.npwp_nib && <p className="text-xs text-destructive">{errors.npwp_nib}</p>}
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <p className="text-xs font-medium text-destructive">{errors.submit}</p>
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
        <div className="w-full max-w-md">
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
