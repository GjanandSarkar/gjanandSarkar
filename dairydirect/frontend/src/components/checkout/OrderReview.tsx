"use client";

import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import type { ProductWithVariants } from '@/lib/api/products';
import { useTranslation } from '@/lib/i18n';

interface CartItemData {
  productId: string;
  variantId: string;
  quantity: number;
  product: ProductWithVariants;
  variant: {
    id: string;
    weight: string;
    price: number;
    original_price: number | null;
  };
}

interface OrderReviewProps {
  items: CartItemData[];
}

export function OrderReview({ items }: OrderReviewProps) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-[20px] p-4 border border-sand shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-dark uppercase tracking-wider">Order Items</h3>
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-auto">
          {items.reduce((acc, item) => acc + item.quantity, 0)} Items
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3">
            {/* Image */}
            <div className="w-12 h-12 relative bg-sand/30 rounded-[10px] overflow-hidden shrink-0 border border-sand/50">
              {item.product.image_url ? (
                <Image 
                  src={item.product.image_url} 
                  alt={item.product.name} 
                  fill 
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-mint/20 text-primary font-bold text-xs">
                  {item.product.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-dark truncate leading-tight">
                {item.product.name}
              </h4>
              <p className="text-[11px] font-medium text-muted mt-0.5">
                {item.variant.weight} × {item.quantity}
              </p>
            </div>

            {/* Price */}
            <div className="text-right shrink-0">
              <span className="text-sm font-black text-dark">
                {t('currency')}{item.variant.price * item.quantity}
              </span>
              {item.variant.original_price && item.variant.original_price > item.variant.price && (
                <p className="text-[10px] text-muted line-through font-medium mt-0.5">
                  {t('currency')}{item.variant.original_price * item.quantity}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
