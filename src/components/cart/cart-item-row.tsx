"use client"

import { useState } from "react"
import Image from "next/image"
import { Minus, Plus, Trash2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"
import { GRADE_BG } from "@/lib/constants"
import type { CartItem, Grade } from "@/lib/types"

interface CartItemRowProps {
  item: CartItem
  onUpdateQty: (itemId: number, quantityKg: number) => Promise<void>
  onRemove: (itemId: number) => Promise<void>
}

export function CartItemRow({ item, onUpdateQty, onRemove }: CartItemRowProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const { product, quantity_kg } = item
  const isUnavailable = product.status !== "published"
  const subtotal = product.price_per_kg * quantity_kg
  const imageUrl = product.images_url?.[0]

  async function handleUpdateQty(newQty: number) {
    if (newQty < 0.5) return
    setIsUpdating(true)
    try {
      await onUpdateQty(item.id, newQty)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleRemove() {
    setIsRemoving(true)
    try {
      await onRemove(item.id)
    } finally {
      setIsRemoving(false)
    }
  }

  const isBusy = isUpdating || isRemoving

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-border bg-white p-3 transition-opacity",
        isBusy && "pointer-events-none opacity-50",
        isUnavailable && "opacity-60",
      )}
    >
      {/* Product Image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.fabric_name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-8 w-8 text-tenunara-teal/30" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Name + Grade + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-tenunara-charcoal">
              {product.fabric_name}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              {product.final_grade && (
                <span
                  className={cn(
                    "inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                    GRADE_BG[product.final_grade as Grade],
                  )}
                >
                  Grade {product.final_grade}
                </span>
              )}
              {isUnavailable && (
                <span className="inline-flex rounded-md bg-destructive/10 px-1.5 py-0.5 text-[11px] font-semibold text-destructive">
                  Tidak Tersedia
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Price per kg */}
        <p className="text-xs text-tenunara-teal">
          {formatCurrency(product.price_per_kg)} / kg
        </p>

        {/* Quantity stepper + subtotal + delete */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => handleUpdateQty(quantity_kg - 0.5)}
              disabled={isBusy || quantity_kg <= 0.5}
              aria-label="Kurangi jumlah"
            >
              <Minus />
            </Button>
            <span className="min-w-[3rem] text-center text-sm font-medium text-tenunara-charcoal">
              {quantity_kg} kg
            </span>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => handleUpdateQty(quantity_kg + 0.5)}
              disabled={isBusy}
              aria-label="Tambah jumlah"
            >
              <Plus />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-tenunara-charcoal">
              {formatCurrency(subtotal)}
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleRemove}
              disabled={isBusy}
              aria-label="Hapus item"
              className="text-destructive hover:text-destructive"
            >
              {isRemoving ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Trash2 />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
