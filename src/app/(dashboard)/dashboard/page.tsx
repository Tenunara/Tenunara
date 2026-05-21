"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { UmkmDashboard } from "@/components/dashboard/umkm-dashboard";
import { PengrajinDashboard } from "@/components/dashboard/pengrajin-dashboard";
import type { UserRole } from "@/lib/types";

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem("sb-user-role") as UserRole | null;
    setRole(storedRole);
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-tenunara-terracotta" />
      </div>
    );
  }

  if (role === "umkm" || role === "seller") {
    return <UmkmDashboard />;
  }

  return <PengrajinDashboard />;
}
