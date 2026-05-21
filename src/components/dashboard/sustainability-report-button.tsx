"use client";

import { useState, useRef } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface SustainabilityReportButtonProps {
  reportRef: React.RefObject<HTMLDivElement | null>;
}

export function SustainabilityReportButton({
  reportRef,
}: SustainabilityReportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!reportRef.current) return;
    setExporting(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight() - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight() - 20;
      }

      pdf.save("laporan-keberlanjutan-tenunara.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 rounded-xl bg-tenunara-terracotta px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#8A3F31] disabled:opacity-60"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {exporting
        ? "Mengexport..."
        : "Unduh Laporan Keberlanjutan Resmi (POJK 51)"}
    </Button>
  );
}
