"use client";

import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import type { OrderWithItems } from '@/lib/api/orders';
import { useTranslation } from '@/lib/i18n';

interface OrderItemsReviewProps {
  order: OrderWithItems;
}

export function OrderItemsReview({ order }: OrderItemsReviewProps) {
  const { t } = useTranslation();

  if (!order.order_items || order.order_items.length === 0) return null;

  return (
    <div className="bg-surface rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
        <ShoppingBag className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Ordered Items</h3>
        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md ml-auto">
          {order.order_items.reduce((acc, item) => acc + item.quantity, 0)} Items
        </span>
      </div>

      <div className="space-y-2.5">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {/* Image */}
            <div className="w-12 h-12 relative bg-surface-muted rounded-lg overflow-hidden shrink-0 border border-border p-1">
              {item.products?.image_url ? (
                <Image 
                  src={item.products.image_url} 
                  alt={item.products.name || 'Product'} 
                  fill 
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs uppercase">
                  {(item.products?.name || 'P').charAt(0)}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-foreground truncate leading-tight">
                {item.products?.name || 'Unknown Product'}
              </h4>
              <p className="text-[11px] font-medium text-muted mt-0.5">
                {item.product_variants?.weight || '1 unit'} × {item.quantity}
              </p>
            </div>

            {/* Price */}
            <div className="text-right shrink-0">
              <span className="text-xs font-extrabold text-foreground tabular-nums">
                {t('currency')}{item.price * item.quantity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
