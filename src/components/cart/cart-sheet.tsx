"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Store, Loader2 } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { CartItemRow } from "@/components/cart/cart-item-row"
import { cn, formatCurrency } from "@/lib/utils"
import type { ReactNode } from "react"

interface CartSheetProps {
  children: ReactNode
}

export function CartSheet({ children }: CartSheetProps) {
  const router = useRouter()
  const { groups, grandTotal, isLoading, error, updateItem, removeItem, checkout, refreshCart } =
    useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const handleCheckout = useCallback(async () => {
    setIsCheckingOut(true)
    setCheckoutError(null)
    try {
      await checkout()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Checkout gagal. Silakan coba lagi."
      setCheckoutError(message)
    } finally {
      setIsCheckingOut(false)
    }
  }, [checkout])

  const showErrorFallback = !isLoading && error && groups.length === 0
  const showEmpty = !isLoading && !error && groups.length === 0
  const showItems = !isLoading && groups.length > 0

  return (
    <Sheet>
      <SheetTrigger>{children}</SheetTrigger>

      <SheetContent
        side="right"
        className={cn("flex flex-col", showItems && "p-0")}
      >
        {/* ── Loading ── */}
        {isLoading && (
          <>
            <SheetHeader>
              <SheetTitle>Keranjang</SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-tenunara-terracotta" />
            </div>
          </>
        )}

        {/* ── Error (no cached data) ── */}
        {showErrorFallback && (
          <>
            <SheetHeader>
              <SheetTitle>Keranjang</SheetTitle>
            </SheetHeader>
            <div className="flex-1">
              <ErrorState message={error} onRetry={refreshCart} />
            </div>
          </>
        )}

        {/* ── Empty ── */}
        {showEmpty && (
          <>
            <SheetHeader>
              <SheetTitle>Keranjang</SheetTitle>
            </SheetHeader>
            <div className="flex-1">
              <EmptyState
                icon={<ShoppingCart className="h-12 w-12" />}
                title="Keranjang Kosong"
                description="Belum ada produk yang ditambahkan ke keranjang. Yuk, mulai belanja kain berkualitas!"
                actionLabel="Cari Produk"
                onAction={() => router.push("/dashboard/browse")}
              />
            </div>
          </>
        )}

        {/* ── Has items ── */}
        {showItems && (
          <>
            <SheetHeader className="border-b border-border px-4 py-3">
              <SheetTitle>Keranjang</SheetTitle>
            </SheetHeader>

            {/* Scrollable items */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="flex flex-col gap-4">
                {groups.map((group) => (
                  <div key={group.umkm_id}>
                    {/* UMKM header */}
                    <div className="mb-2 flex items-center gap-2">
                      <Store className="h-4 w-4 text-tenunara-terracotta" />
                      <span className="text-sm font-semibold text-tenunara-charcoal">
                        {group.umkm_name}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="flex flex-col gap-2">
                      {group.items.map((item) => (
                        <CartItemRow
                          key={item.id}
                          item={item}
                          onUpdateQty={updateItem}
                          onRemove={removeItem}
                        />
                      ))}
                    </div>

                    {/* Group subtotal */}
                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="text-xs text-tenunara-teal">
                        Subtotal {group.umkm_name}
                      </span>
                      <span className="text-sm font-semibold text-tenunara-charcoal">
                        {formatCurrency(group.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkout error banner */}
            {checkoutError && (
              <div className="mx-4 rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {checkoutError}
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-border px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-tenunara-charcoal">
                  Total Belanja
                </span>
                <span className="text-lg font-bold text-tenunara-charcoal">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Checkout"
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
