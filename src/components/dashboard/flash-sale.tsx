"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

interface FlashItem {
  id: string
  storeName: string
  productName: string
  price: number
  originalPrice: number
  discount: number
}

interface FlashSaleProps {
  items: FlashItem[]
}

export function FlashSale({ items }: FlashSaleProps) {
  const [timeLeft, setTimeLeft] = useState({ h: 12, m: 30, s: 45 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 }
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 }
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (items.length === 0) return null

  const pad = (n: number) => String(n).padStart(2, "0")

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="font-heading text-lg font-bold text-tenunara-charcoal">
          ⚡ Flash Sale
        </h3>
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-tenunara-terracotta px-3 py-1 text-xs font-semibold text-white">
          <Clock className="h-3 w-3" />
          <span>{pad(timeLeft.h)}</span>:<span>{pad(timeLeft.m)}</span>:<span>{pad(timeLeft.s)}</span>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
        {items.map((item) => (
          <div
            key={item.id}
            className="w-44 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-white transition-all hover:shadow-md"
          >
            <div className="relative aspect-square bg-tenunara-canvas">
              <div className="absolute inset-4 rounded-lg bg-gradient-to-br from-tenunara-mint to-tenunara-canvas opacity-50" />
              <span className="absolute left-2 top-2 rounded-md bg-tenunara-terracotta px-2 py-0.5 text-[10px] font-bold text-white">
                -{item.discount}%
              </span>
            </div>
            <div className="space-y-1 p-3">
              <p className="truncate text-[11px] text-tenunara-teal">{item.storeName}</p>
              <p className="line-clamp-2 text-xs font-semibold text-tenunara-charcoal leading-snug">
                {item.productName}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-tenunara-terracotta">
                  {formatCurrency(item.price)}
                </span>
                <span className="text-[10px] text-tenunara-teal line-through opacity-50">
                  {formatCurrency(item.originalPrice)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
