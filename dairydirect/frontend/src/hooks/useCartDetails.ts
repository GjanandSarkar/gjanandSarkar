import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { getProducts } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';

export interface CartItemWithStock {
  productId: string;
  variantId: string;
  quantity: number;
  product: ProductWithVariants;
  variant: NonNullable<ProductWithVariants['product_variants']>[0];
  availableStock: number;
  isOutOfStock: boolean;
  isInsufficientStock: boolean;
  hasStockIssue: boolean;
}

// Module-level cache & in-flight promise sharing to avoid duplicate concurrent calls across Header, CartButton, FloatingCartBar, and CartDrawer
let cachedProductsData: ProductWithVariants[] | null = null;
let inFlightInventoryPromise: Promise<ProductWithVariants[]> | null = null;
let lastCartSignature = '';
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 4000; // 4-second freshness window

export function useCartDetails() {
  const cart = useStore(state => state.cart);
  const [products, setProducts] = useState<ProductWithVariants[]>(() => cachedProductsData || []);
  const [isLoading, setIsLoading] = useState(!cachedProductsData);

  // Settings
  const settings = { free_delivery_threshold: 299, delivery_cost: 25 };

  const refreshInventory = useCallback(async () => {
    const currentSignature = cart.map(c => `${c.productId}:${c.variantId}:${c.quantity}`).sort().join(',');
    const now = Date.now();

    // Use cached data if cart hasn't changed and cache is within TTL
    if (cachedProductsData && currentSignature === lastCartSignature && now - lastFetchTimestamp < CACHE_TTL_MS) {
      setProducts(cachedProductsData);
      setIsLoading(false);
      return;
    }

    // Share existing in-flight promise if multiple components mount simultaneously
    if (inFlightInventoryPromise) {
      try {
        const prods = await inFlightInventoryPromise;
        setProducts(prods);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    inFlightInventoryPromise = (async () => {
      try {
        const prods = await getProducts({ activeOnly: true });
        if (cart.length > 0) {
          const vids = cart.map(c => c.variantId).filter(Boolean);
          if (vids.length > 0) {
            const res = await fetch(`/api/inventory/status?variant_ids=${vids.join(',')}`, { cache: 'no-store' });
            if (res.ok) {
              const liveData = await res.json();
              if (liveData.variants) {
                const updated = prods.map(p => ({
                  ...p,
                  product_variants: p.product_variants?.map(v => {
                    const match = liveData.variants.find((m: any) => m.id === v.id);
                    return match
                      ? {
                          ...v,
                          stock: match.stock,
                          available_quantity: match.available_quantity,
                          reserved_quantity: match.reserved_quantity,
                        }
                      : v;
                  }),
                }));
                cachedProductsData = updated;
                lastCartSignature = currentSignature;
                lastFetchTimestamp = Date.now();
                return updated;
              }
            }
          }
        }
        cachedProductsData = prods;
        lastCartSignature = currentSignature;
        lastFetchTimestamp = Date.now();
        return prods;
      } finally {
        inFlightInventoryPromise = null;
      }
    })();

    try {
      const result = await inFlightInventoryPromise;
      setProducts(result);
    } catch (err) {
      console.error('Error refreshing cart inventory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cart]);

  useEffect(() => {
    refreshInventory();
  }, [refreshInventory]);

  const cartItemsData = useMemo<CartItemWithStock[]>(() => {
    return cart
      .map(item => {
        const product = products.find(p => p.id === item.productId);
        const variant = product?.product_variants?.find(v => v.id === item.variantId);
        if (!product || !variant) return null;

        const availableStock = Math.max(0, variant.available_quantity ?? variant.stock ?? 0);
        const isOutOfStock = availableStock <= 0;
        const isInsufficientStock = !isOutOfStock && item.quantity > availableStock;
        const hasStockIssue = isOutOfStock || isInsufficientStock;

        return {
          ...item,
          product,
          variant,
          availableStock,
          isOutOfStock,
          isInsufficientStock,
          hasStockIssue,
        };
      })
      .filter(Boolean) as CartItemWithStock[];
  }, [cart, products]);

  const hasStockIssue = cartItemsData.some(item => item.hasStockIssue);
  const itemsWithStockIssues = cartItemsData.filter(item => item.hasStockIssue);

  const subtotal = cartItemsData.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isFreeDelivery = subtotal >= settings.free_delivery_threshold;
  const delivery = subtotal > 0 ? (isFreeDelivery ? 0 : settings.delivery_cost) : 0;
  const total = subtotal + delivery;
  const deliveryProgress = Math.min((subtotal / settings.free_delivery_threshold) * 100, 100);
  const neededForFree = settings.free_delivery_threshold - subtotal;
  const canProceedToCheckout = !hasStockIssue && cartItemsData.length > 0;

  return {
    cartItemsData,
    subtotal,
    totalItems,
    delivery,
    total,
    isFreeDelivery,
    deliveryProgress,
    neededForFree,
    isLoading,
    isEmpty: cartItemsData.length === 0,
    hasStockIssue,
    itemsWithStockIssues,
    canProceedToCheckout,
    refreshInventory,
    settings,
  };
}
