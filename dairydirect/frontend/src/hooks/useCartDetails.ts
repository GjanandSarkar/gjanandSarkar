import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { getProducts } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';

export function useCartDetails() {
  const cart = useStore(state => state.cart);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hardcoded settings (can be moved to global settings API later)
  const settings = { free_delivery_threshold: 299, delivery_cost: 25 };

  useEffect(() => {
    getProducts({ activeOnly: true }).then(data => {
      setProducts(data);
      setIsLoading(false);
    });
  }, []);

  const cartItemsData = useMemo(() => {
    return cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      const variant = product?.product_variants?.find(v => v.id === item.variantId);
      return product && variant ? { ...item, product, variant } : null;
    }).filter(Boolean) as ({
      productId: string;
      variantId: string;
      quantity: number;
      product: ProductWithVariants;
      variant: NonNullable<ProductWithVariants['product_variants']>[0];
    })[];
  }, [cart, products]);

  const subtotal = cartItemsData.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isFreeDelivery = subtotal >= settings.free_delivery_threshold;
  const delivery = subtotal > 0 ? (isFreeDelivery ? 0 : settings.delivery_cost) : 0;
  const total = subtotal + delivery;
  const deliveryProgress = Math.min((subtotal / settings.free_delivery_threshold) * 100, 100);
  const neededForFree = settings.free_delivery_threshold - subtotal;

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
    settings
  };
}
