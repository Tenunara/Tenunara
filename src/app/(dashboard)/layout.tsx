"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { LoadingSpinner } from "@/components/shared";
import { toast } from "sonner";
import type { PengrajinRow, UmkmRow, UserRole } from "@/lib/types";

type AuthProfile = {
  user: { id: string; email: string; role: UserRole };
  profile: PengrajinRow | UmkmRow;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authData, setAuthData] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sb-access-token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Sesi tidak valid");
        return res.json();
      })
      .then((data: AuthProfile) => {
        setAuthData(data);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("sb-access-token");
        localStorage.removeItem("sb-refresh-token");
        localStorage.removeItem("sb-user-role");
        localStorage.removeItem("sb-user-id");
        document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
        router.push("/login");
      });
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem("sb-access-token");
    localStorage.removeItem("sb-refresh-token");
    localStorage.removeItem("sb-user-role");
    localStorage.removeItem("sb-user-id");
    document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    toast.success("Berhasil keluar");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-tenunara-canvas">
        <LoadingSpinner size="lg" text="Memuat..." />
      </div>
    );
  }

  if (!authData) {
    return null;
  }

  const userProfile = {
    id: authData.user.id,
    name:
      "nama" in authData.profile
        ? authData.profile.nama
        : authData.profile.nama_penjual,
    role: authData.user.role,
    company:
      "nama_toko" in authData.profile ? authData.profile.nama_toko : null,
    created_at: authData.profile.created_at,
  };

  return (
    <div className="flex min-h-screen flex-col bg-tenunara-canvas">
      <div className="lg:hidden">
        <Navbar user={userProfile} onLogout={handleLogout} />
      </div>
      <div className="flex flex-1">
        <Sidebar user={userProfile} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
