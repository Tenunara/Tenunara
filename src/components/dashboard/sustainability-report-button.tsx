"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Token helper ──────────────────────────────────────────
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("sb-access-token") ||
    localStorage.getItem("access_token")
  );
}

// ─── Component ─────────────────────────────────────────────
export function SustainabilityReportButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const token = getToken();
      const res = await fetch("/api/dashboard/umkm/report", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "Sesi habis. Silakan login ulang."
            : "Gagal memuat laporan keberlanjutan.",
        );
      }

      const html = await res.text();

      // Open a new window with the rendered report, then trigger print
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error(
          "Popup diblokir. Izinkan popup untuk mengunduh laporan.",
        );
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      // Wait for fonts / images to settle, then open native print dialog
      setTimeout(() => {
        printWindow.print();
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan";
      console.error("Report export failed:", err);
      alert(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 rounded-xl bg-tenunara-terracotta px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-tenunara-terracotta/90 disabled:opacity-60"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {exporting
        ? "Menyiapkan laporan..."
        : "Unduh Laporan Keberlanjutan Resmi (POJK 51)"}
    </Button>
  );
}
