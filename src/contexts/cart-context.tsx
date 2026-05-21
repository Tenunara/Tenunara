"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { fetchCart, addCartItem, updateCartItem, removeCartItem, checkoutCart } from "@/lib/api";
import type { CartData, CartGroup, CartItem } from "@/lib/types";

interface CartContextValue {
  itemsCount: number;
  groups: CartGroup[];
  grandTotal: number;
  isLoading: boolean;
  error: string | null;
  addItem: (productId: string, quantityKg: number) => Promise<void>;
  updateItem: (itemId: number, quantityKg: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  checkout: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserRole =
    typeof window !== "undefined" ? localStorage.getItem("sb-user-role") : null;
  const isPengrajin = currentUserRole === "pengrajin";

  const refreshCart = useCallback(async () => {
    if (!isPengrajin) {
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await fetchCart();
      setCartData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isPengrajin]);

  useEffect(() => {
    const token = localStorage.getItem("sb-access-token");
    if (token && isPengrajin) {
      setIsLoading(true);
      refreshCart();
    } else {
      setIsLoading(false);
    }
  }, [refreshCart, isPengrajin]);

  const addItem = useCallback(
    async (productId: string, quantityKg: number) => {
      try {
        setError(null);
        await addCartItem(productId, quantityKg);
        await refreshCart();
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [refreshCart],
  );

  const updateItem = useCallback(
    async (itemId: number, quantityKg: number) => {
      try {
        setError(null);
        await updateCartItem(itemId, quantityKg);
        await refreshCart();
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [refreshCart],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      try {
        setError(null);
        await removeCartItem(itemId);
        await refreshCart();
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [refreshCart],
  );

  const checkout = useCallback(async () => {
    try {
      setError(null);
      const res = await checkoutCart();
      setCartData((prev) =>
        prev ? { ...prev, groups: [], items_count: 0, grand_total: 0 } : prev,
      );

      // If checkout created orders, redirect to payment page for the first order
      if (res && Array.isArray(res.orders) && res.orders.length > 0) {
        const firstOrderId = res.orders[0].order_id;
        router.push(`/dashboard/orders/${firstOrderId}`);
      } else {
        router.push("/dashboard/orders");
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [router]);

  return (
    <CartContext.Provider
      value={{
        itemsCount: cartData?.items_count || 0,
        groups: cartData?.groups || [],
        grandTotal: cartData?.grand_total || 0,
        isLoading,
        error,
        addItem,
        updateItem,
        removeItem,
        checkout,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}

/**
 * Safe version of useCart that returns null when used outside CartProvider.
 * Useful for components rendered in both public and dashboard layouts (e.g., navbar).
 */
export function useCartSafe(): CartContextValue | null {
  try {
    return useCart();
  } catch {
    return null;
  }
}
