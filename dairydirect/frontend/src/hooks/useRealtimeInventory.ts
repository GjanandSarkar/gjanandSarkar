"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface LiveVariantStock {
  variantId: string;
  productId: string;
  stock: number;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  isOutOfStock: boolean;
  isLowStock: boolean;
}

interface UseRealtimeInventoryOptions {
  productId?: string;
  variantId?: string;
  onUpdate?: (updatedVariant: LiveVariantStock) => void;
}

/**
 * Hook for subscribing to live, authoritative inventory changes via Supabase Realtime.
 * 
 * Used across:
 * - Product Details page (ProductClient)
 * - Product Card (ProductCard)
 * - Cart (CartScreen)
 * - Seller Panel
 * 
 * Provides Amazon/Flipkart-style instant stock updates across clients when any customer purchases.
 */
export function useRealtimeInventory(options: UseRealtimeInventoryOptions = {}) {
  const { productId, variantId, onUpdate } = options;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const [stockMap, setStockMap] = useState<Record<string, LiveVariantStock>>({});

  const handlePayload = useCallback((payload: any) => {
    if (!payload.new) return;
    const row = payload.new;

    const available = row.available_quantity !== undefined 
      ? row.available_quantity 
      : Math.max(0, (row.stock || 0) - (row.reserved_quantity || 0));

    const threshold = row.low_stock_threshold || 10;

    const liveData: LiveVariantStock = {
      variantId: row.id,
      productId: row.product_id,
      stock: row.stock || 0,
      availableQuantity: available,
      reservedQuantity: row.reserved_quantity || 0,
      lowStockThreshold: threshold,
      isOutOfStock: available <= 0,
      isLowStock: available > 0 && available <= threshold,
    };

    setStockMap((prev) => ({
      ...prev,
      [row.id]: liveData,
    }));

    if (onUpdateRef.current) {
      onUpdateRef.current(liveData);
    }
  }, []);

  useEffect(() => {
    const channelName = `realtime-inventory-${productId || variantId || 'all'}-${Date.now()}`;
    let channel: RealtimeChannel;

    try {
      let filterString: string | undefined = undefined;
      if (variantId) {
        filterString = `id=eq.${variantId}`;
      } else if (productId) {
        filterString = `product_id=eq.${productId}`;
      }

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes' as any,
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'product_variants',
            filter: filterString,
          },
          (payload: any) => {
            handlePayload(payload);
          }
        )
        .on(
          'postgres_changes' as any,
          {
            event: 'INSERT',
            schema: 'public',
            table: 'product_variants',
            filter: filterString,
          },
          (payload: any) => {
            handlePayload(payload);
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            // Channel active
          }
        });
    } catch (err) {
      console.warn('[useRealtimeInventory] Subscription warning:', err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [productId, variantId, handlePayload]);

  return { stockMap };
}
