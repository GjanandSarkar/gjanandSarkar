"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MessageSquare, Star, Info, MapPin, Repeat, ThermometerSnowflake, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { getOrderById } from '@/lib/api/orders';
import type { OrderWithItems } from '@/lib/api/orders';
import { TrackingSkeleton } from '@/components/tracking/TrackingSkeleton';
import { OrderStatusTimeline } from '@/components/tracking/OrderStatusTimeline';
import { OrderItemsReview } from '@/components/tracking/OrderItemsReview';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n';

export default function TrackingPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { t } = useTranslation();
  
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cart actions for reordering
  const addToCartLocal = useStore(state => state.addToCartLocal);
  const user = useStore(state => state.user);

  useEffect(() => {
    getOrderById(id).then(res => {
      setOrder(res);
      setIsLoading(false);
    });
  }, [id]);

  const handleReorder = async () => {
    if (!order || !order.order_items) return;
    
    // Import dynamically to avoid circular dependencies if any
    const { addToCart } = await import('@/lib/api/cart');
    
    const promises: Promise<any>[] = [];

    for (const item of order.order_items) {
      if (item.product_id && item.variant_id) {
        // NOTE: In a full implementation, we should check product.is_active and variant.stock here
        // Currently, it trusts the previous order's items. If a variant is out of stock, 
        // the cart or checkout validation will catch it later.
        addToCartLocal(item.product_id, item.variant_id, item.quantity);
        if (user) {
          promises.push(addToCart(user.id, item.product_id, item.variant_id, item.quantity));
        }
      }
    }
    
    if (promises.length > 0) {
      await Promise.all(promises);
    }
    
    router.push('/cart');
  };

  if (isLoading) return <TrackingSkeleton />;

  if (!order) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-cream px-6 text-center">
        <Info className="w-16 h-16 text-muted mb-4 opacity-50" />
        <h1 className="text-xl font-bold text-dark mb-2">Tracking Unavailable</h1>
        <p className="text-muted text-sm mb-6">We couldn't find the tracking details for this order.</p>
        <Button className="shadow-active" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const addressLabel = order.user_addresses?.label || 'Delivery Address';
  const addressText = order.user_addresses?.address || 'Details unavailable';

  const statusLabel =
    order.status === 'delivered'
      ? 'Delivered'
      : order.status === 'out_for_delivery'
        ? 'Arriving soon'
        : order.status === 'cancelled'
          ? 'Cancelled'
          : 'Preparing your order';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="w-full max-w-3xl mx-auto px-4 pt-4 pb-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 rounded-full bg-surface border border-border grid place-items-center text-foreground active:scale-95 transition-transform shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-foreground leading-tight truncate">
              Order #{order.id.substring(0, 8)}
            </h1>
            <p className="text-xs text-foreground-muted">
              Placed {new Date(order.created_at || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Status. This page used to open with a 40vh map pinned to two
            hardcoded Ahmedabad coordinates, with a "Live Driver GPS: NOT
            CONFIGURED" label sitting on top of it. There is no driver
            telemetry, so that map showed every customer the same invented
            route; it is removed until real locations exist rather than
            dressed up as tracking. */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-foreground leading-tight">
                {statusLabel}
              </h2>
              {order.status !== 'cancelled' && (
                <p className="text-sm text-foreground-muted font-medium mt-1">
                  Expected by{' '}
                  {new Date(order.delivery_date || Date.now()).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              )}
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-primary-fixed text-primary text-xs font-bold uppercase tracking-wide border border-primary/20 shrink-0">
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <OrderStatusTimeline currentStatus={order.status} />

        {/* Delivery address */}
        <div className="bg-surface rounded-2xl border border-border p-5 shadow-2xs">
          <h3 className="font-bold text-foreground text-xs flex items-center mb-2 uppercase tracking-wider">
            <MapPin className="w-4 h-4 mr-2 text-primary" /> {addressLabel}
          </h3>
          <p className="text-sm text-foreground-muted leading-relaxed font-medium">
            {addressText}
          </p>
        </div>

        <OrderItemsReview order={order} />

        <div className="flex items-center gap-2 text-xs font-semibold text-foreground-muted bg-surface-muted rounded-xl p-3 border border-border">
          <ShieldCheck className="w-4 h-4 text-success shrink-0" />
          <span>Something wrong with this order? Our support team can help.</span>
        </div>
      </div>

      {/* Sticky actions. Previously offset by md:left-[260px] for an admin
          sidebar that does not exist on the customer shell, and pinned to
          bottom-0 where the mobile nav sits. */}
      <div className="sticky bottom-0 z-30 mt-auto bg-surface border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Button variant="outline" className="flex-1 font-bold text-sm h-12" onClick={() => router.push('/support')}>
            Need help?
          </Button>
          <Button className="flex-1 font-bold text-sm h-12" onClick={handleReorder}>
            <Repeat className="w-4 h-4 mr-2" /> Reorder
          </Button>
        </div>
      </div>
    </div>
  );
}
