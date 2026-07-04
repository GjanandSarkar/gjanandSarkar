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
    <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-sand">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="w-5 h-5 text-primary" />
        <h3 className="text-base font-black text-dark tracking-wide">Order Items</h3>
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-auto">
          {order.order_items.reduce((acc, item) => acc + item.quantity, 0)} Items
        </span>
      </div>

      <div className="space-y-4">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {/* Image */}
            <div className="w-14 h-14 relative bg-sand/30 rounded-[12px] overflow-hidden shrink-0 border border-sand/50">
              {item.products?.image_url ? (
                <Image 
                  src={item.products.image_url} 
                  alt={item.products.name || 'Product'} 
                  fill 
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-mint/20 text-primary font-bold text-xs uppercase">
                  {(item.products?.name || 'P').charAt(0)}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-dark truncate leading-tight">
                {item.products?.name || 'Unknown Product'}
              </h4>
              <p className="text-xs font-medium text-muted mt-1">
                {item.product_variants?.weight || '1 unit'} × {item.quantity}
              </p>
            </div>

            {/* Price */}
            <div className="text-right shrink-0">
              <span className="text-sm font-black text-dark">
                {t('currency')}{item.price * item.quantity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
