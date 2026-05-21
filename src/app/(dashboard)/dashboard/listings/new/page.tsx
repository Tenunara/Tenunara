"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Camera,
  FileText,
  Loader2,
  Info,
} from "lucide-react";
import { ImageUploader } from "@/components/listing/image-uploader";
import { AIResultDisplay } from "@/components/listing/ai-result-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  fetchFabricTypes,
  createProduct,
  analyzeProductImages,
} from "@/lib/api";
import {
  PRODUCTION_SOURCE_LABEL,
  HYGIENE_STATUS_LABEL,
  AI_SIZE_RANGE_LABEL,
} from "@/lib/constants";
import type {
  FabricType,
  AIAnalysisResult,
  CreateProductRequest,
} from "@/lib/types";

type Step = "upload" | "review" | "form";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "upload", label: "Upload Foto", icon: <Camera className="h-4 w-4" /> },
  { key: "review", label: "Review AI", icon: <FileText className="h-4 w-4" /> },
  { key: "form", label: "Lengkapi Data", icon: <Check className="h-4 w-4" /> },
];

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [imagesBase64, setImagesBase64] = useState<string[]>([]);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fabricTypes, setFabricTypes] = useState<FabricType[]>([]);

  // Form fields
  const [fabricTypeId, setFabricTypeId] = useState("");
  const [fiberComposition, setFiberComposition] = useState("");
  const [productionSource, setProductionSource] = useState("");
  const [hygieneStatus, setHygieneStatus] = useState("");
  const [hasOdor, setHasOdor] = useState(false);
  const [totalWeightKg, setTotalWeightKg] = useState("");
  const [estimatedPieces, setEstimatedPieces] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [minimumOrderKg, setMinimumOrderKg] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  useEffect(() => {
    fetchFabricTypes()
      .then(setFabricTypes)
      .catch(() => {});
  }, []);

  const handleImagesReady = useCallback(async (base64Array: string[]) => {
    setImagesBase64(base64Array);
    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const result = await analyzeProductImages(base64Array.length);
      setAiResult(result);
      setAnalysisLoading(false);
      setStep("review");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal menganalisis foto";
      setAnalysisError(msg);
      setAnalysisLoading(false);
      setStep("form");
    }
  }, []);

  const handleConfirmAI = () => {
    setStep("form");
  };

  const handleRetake = () => {
    setStep("upload");
    setAiResult(null);
    setImagesBase64([]);
    setAnalysisError(null);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fabricTypeId) errs.fabricTypeId = "Pilih jenis kain";
    if (!productionSource) errs.productionSource = "Pilih sumber produksi";
    if (!hygieneStatus) errs.hygieneStatus = "Pilih status kebersihan";
    if (!totalWeightKg || Number(totalWeightKg) < 0.5)
      errs.totalWeightKg = "Berat minimal 0.5 kg";
    if (!pricePerKg || Number(pricePerKg) <= 0)
      errs.pricePerKg = "Harga per kg wajib diisi";
    if (notes.length > 300) errs.notes = "Catatan maksimal 300 karakter";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: CreateProductRequest & { ai_result?: AIAnalysisResult } = {
        fabric_type_id: Number(fabricTypeId),
        production_source:
          productionSource as CreateProductRequest["production_source"],
        hygiene_status: hygieneStatus as CreateProductRequest["hygiene_status"],
        has_odor: hasOdor,
        total_weight_kg: Number(totalWeightKg),
        price_per_kg: Number(pricePerKg),
        is_negotiable: isNegotiable,
        images_base64: imagesBase64,
        status: "published",
        ...(fiberComposition && { fiber_composition: fiberComposition }),
        ...(estimatedPieces && { estimated_pieces: Number(estimatedPieces) }),
        ...(minimumOrderKg && { minimum_order_kg: Number(minimumOrderKg) }),
        ...(notes && { notes }),
        ...(aiResult && { ai_result: aiResult }),
      };

      await createProduct(payload);
      router.push("/dashboard/listings");
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : "Gagal membuat produk",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === "upload") router.push("/dashboard/listings");
    else if (step === "review") setStep("upload");
    else setStep("review");
  };

  const selectClass = (hasError: boolean) =>
    cn(hasError && "border-destructive ring-1 ring-destructive");

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-tenunara-teal transition-colors duration-200 hover:text-tenunara-charcoal"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <h1 className="text-2xl font-bold text-tenunara-charcoal">
        Buat Listing Baru
      </h1>
      <p className="mt-1 text-sm text-tenunara-teal">
        Upload foto kain untuk analisis AI otomatis
      </p>

      {/* Steps indicator */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200",
                i <= stepIndex
                  ? "bg-tenunara-terracotta text-white"
                  : "bg-tenunara-mint/50 text-tenunara-teal",
              )}
            >
              {s.icon}
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-8",
                  i < stepIndex ? "bg-tenunara-terracotta" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            <ImageUploader onImagesReady={handleImagesReady} maxImages={5} />

            {analysisError && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive">
                  AI gagal menganalisis foto: {analysisError}
                </p>
                <p className="mt-1 text-xs text-tenunara-teal">
                  Anda akan diarahkan ke form input manual
                </p>
              </div>
            )}

            {analysisLoading && (
              <div className="flex items-center justify-center gap-3 rounded-2xl bg-tenunara-mint/30 p-6">
                <Loader2 className="h-6 w-6 animate-spin text-tenunara-terracotta" />
                <p className="text-sm font-medium text-tenunara-charcoal">
                  AI sedang menganalisis foto...
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Review AI */}
        {step === "review" && (
          <AIResultDisplay
            result={aiResult}
            isLoading={false}
            onConfirm={handleConfirmAI}
            onRetake={handleRetake}
          />
        )}

        {/* STEP 3: Form */}
        {step === "form" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-tenunara-charcoal">
              {aiResult ? "Review & Publikasikan" : "Input Manual"}
            </h2>

            <div className="space-y-6">
              {/* Fabric Type */}
              <div className="space-y-2">
                <Label htmlFor="fabricType">
                  Jenis Kain <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={fabricTypeId}
                  onValueChange={(v) => v && setFabricTypeId(v)}
                >
                  <SelectTrigger
                    className={cn(
                      "w-full bg-white",
                      selectClass(!!errors.fabricTypeId),
                    )}
                  >
                    <SelectValue placeholder="Pilih jenis kain">
                      {fabricTypeId
                        ? fabricTypes.find(
                            (ft) => String(ft.id) === fabricTypeId,
                          )?.name
                        : "Pilih jenis kain"}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    {fabricTypes.map((ft) => (
                      <SelectItem key={ft.id} value={String(ft.id)}>
                        <span className="block truncate pr-4 text-left">
                          {ft.name}{" "}
                          {ft.common_uses ? `– ${ft.common_uses}` : ""}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fabricTypeId && (
                  <p className="text-xs text-destructive">
                    {errors.fabricTypeId}
                  </p>
                )}
              </div>

              {/* Fiber Composition */}
              <div className="space-y-2">
                <Label htmlFor="fiberComposition">
                  Komposisi Serat (opsional)
                </Label>
                <Input
                  id="fiberComposition"
                  placeholder="Contoh: 100% Katun, 65% Polyester 35% Cotton"
                  value={fiberComposition}
                  onChange={(e) => setFiberComposition(e.target.value)}
                />
              </div>

              {/* Production Source */}
              <div className="space-y-2">
                <Label htmlFor="productionSource">
                  Sumber Produksi <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={productionSource}
                  onValueChange={(v) => v && setProductionSource(v)}
                >
                  <SelectTrigger
                    className={cn(
                      "w-full bg-white",
                      selectClass(!!errors.productionSource),
                    )}
                  >
                    <SelectValue placeholder="Pilih sumber produksi">
                      {productionSource
                        ? PRODUCTION_SOURCE_LABEL[
                            productionSource as keyof typeof PRODUCTION_SOURCE_LABEL
                          ]
                        : "Pilih sumber produksi"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCTION_SOURCE_LABEL).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                {errors.productionSource && (
                  <p className="text-xs text-destructive">
                    {errors.productionSource}
                  </p>
                )}
              </div>

              {/* Hygiene Status */}
              <div className="space-y-2">
                <Label htmlFor="hygieneStatus">
                  Status Kebersihan <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={hygieneStatus}
                  onValueChange={(v) => v && setHygieneStatus(v)}
                >
                  <SelectTrigger
                    className={cn(
                      "w-full bg-white",
                      selectClass(!!errors.hygieneStatus),
                    )}
                  >
                    <SelectValue placeholder="Pilih status kebersihan">
                      {hygieneStatus
                        ? HYGIENE_STATUS_LABEL[
                            hygieneStatus as keyof typeof HYGIENE_STATUS_LABEL
                          ]
                        : "Pilih status kebersihan"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(HYGIENE_STATUS_LABEL).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                {errors.hygieneStatus && (
                  <p className="text-xs text-destructive">
                    {errors.hygieneStatus}
                  </p>
                )}
              </div>

              {/* AI Info (if available) */}
              {aiResult && (
                <div className="rounded-xl bg-tenunara-mint/30 p-4">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-tenunara-terracotta" />
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-tenunara-charcoal">
                        Hasil Analisis AI
                      </p>
                      <p className="text-tenunara-teal">
                        Warna:{" "}
                        {aiResult.ai_dominant_color?.split(";")[1] || "-"} |
                        Ukuran:{" "}
                        {AI_SIZE_RANGE_LABEL[aiResult.ai_size_range] || "-"} |
                        Grade: {aiResult.ai_suggested_grade}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Has Odor checkbox */}
              <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                <input
                  type="checkbox"
                  checked={hasOdor}
                  onChange={(e) => setHasOdor(e.target.checked)}
                  className="h-4 w-4 rounded border-tenunara-teal text-tenunara-terracotta focus:ring-tenunara-terracotta"
                />
                <span className="text-sm text-tenunara-charcoal">
                  Kain memiliki bau
                </span>
              </label>

              {/* Weight row */}
              <div className="space-y-2">
                <Label htmlFor="totalWeight">
                  Berat Total (kg) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="totalWeight"
                  type="number"
                  min={0.5}
                  step={0.1}
                  placeholder="0.5"
                  value={totalWeightKg}
                  onChange={(e) => setTotalWeightKg(e.target.value)}
                  className={selectClass(!!errors.totalWeightKg)}
                />
                {errors.totalWeightKg && (
                  <p className="text-xs text-destructive">
                    {errors.totalWeightKg}
                  </p>
                )}
              </div>

              {/* Estimated Pieces */}
              <div className="space-y-2">
                <Label htmlFor="estimatedPieces">
                  Estimasi Jumlah Potongan (opsional)
                </Label>
                <Input
                  id="estimatedPieces"
                  type="number"
                  min={1}
                  placeholder="Contoh: 50"
                  value={estimatedPieces}
                  onChange={(e) => setEstimatedPieces(e.target.value)}
                />
              </div>

              {/* Price row */}
              <div className="space-y-2">
                <Label htmlFor="price">
                  Harga per kg (Rp) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  placeholder="10000"
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value)}
                  className={selectClass(!!errors.pricePerKg)}
                />
                {errors.pricePerKg && (
                  <p className="text-xs text-destructive">
                    {errors.pricePerKg}
                  </p>
                )}
              </div>

              {/* Is Negotiable checkbox */}
              <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={(e) => setIsNegotiable(e.target.checked)}
                  className="h-4 w-4 rounded border-tenunara-teal text-tenunara-terracotta focus:ring-tenunara-terracotta"
                />
                <span className="text-sm text-tenunara-charcoal">
                  Harga bisa nego
                </span>
              </label>

              {/* Minimum Order */}
              <div className="space-y-2">
                <Label htmlFor="minimumOrder">
                  Minimum Order (kg, opsional)
                </Label>
                <Input
                  id="minimumOrder"
                  type="number"
                  min={0.5}
                  step={0.1}
                  placeholder="Kosongi jika tidak ada minimum"
                  value={minimumOrderKg}
                  onChange={(e) => setMinimumOrderKg(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Informasi tambahan tentang produk..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={300}
                  className={cn(
                    "min-h-[80px] resize-none",
                    selectClass(!!errors.notes),
                  )}
                />
                {errors.notes && (
                  <p className="text-xs text-destructive">{errors.notes}</p>
                )}
                <p className="text-xs text-tenunara-teal/60">
                  {notes.length}/300 karakter
                </p>
              </div>

              {/* Submit error */}
              {errors.submit && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm font-medium text-destructive">
                    {errors.submit}
                  </p>
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full rounded-xl bg-tenunara-terracotta py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-tenunara-terracotta/90"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mempublikasikan...
                  </span>
                ) : (
                  "Publikasikan"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
