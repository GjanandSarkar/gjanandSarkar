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

export function useCartDetails() {
  const cart = useStore(state => state.cart);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  /* If the catalogue fetch fails, every cart line becomes unresolvable.
     That used to render as "your cart is empty" with no error anywhere. */
  const [loadError, setLoadError] = useState<string | null>(null);

  // Settings
  const settings = { free_delivery_threshold: 299, delivery_cost: 25 };

  const refreshInventory = useCallback(async () => {
    try {
      setLoadError(null);
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
              setProducts(updated);
              return;
            }
          }
        }
      }
      setProducts(prods);
    } catch (err: any) {
      console.error('Error refreshing cart inventory:', err);
      setLoadError(err?.message || 'Could not load cart items');
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
        if (!product || !variant) {
          /* A cart line we cannot resolve against the catalogue. This used to
             disappear in silence, which is how the Deal of the Day bug stayed
             invisible: the homepage listed unapproved products, /api/products
             filtered them out, the line vanished and the cart reported itself
             empty with no error anywhere. Never fail silently here again. */
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              `[cart] dropping unresolvable line product=${item.productId} variant=${item.variantId}. ` +
                'The product is in the cart but not returned by /api/products ' +
                '(inactive, unapproved, or deleted).'
            );
          }
          return null;
        }

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

  const unresolvedCount = cart.length - cartItemsData.length;
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
    /* Emptiness is a property of the CART, not of whether a background
       catalogue fetch happened to succeed. Deriving it from cartItemsData
       meant one failed /api/products request -- or a single product the
       endpoint filtered out -- hid the cart bar entirely and told the
       customer their cart was empty while their items were still in it. */
    isEmpty: cart.length === 0,
    /* Lines we could resolve against the catalogue. Checkout still requires
       every line to resolve; only visibility was wrong. */
    hasResolvedItems: cartItemsData.length > 0,
    unresolvedCount,
    loadError,
    hasStockIssue,
    itemsWithStockIssues,
    canProceedToCheckout,
    refreshInventory,
    settings,
  };
}
