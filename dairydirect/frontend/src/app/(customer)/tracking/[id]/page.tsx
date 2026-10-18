"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, MessageSquare, Star, Info, MapPin, Repeat, ThermometerSnowflake, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import OrderTrackingMap from '@/components/shared/OrderTrackingMap';
import type { Coordinates } from '@/components/shared/MapComponent';
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

  // Farm Coordinates
  const farmCoords: Coordinates = { lat: 23.0300, lng: 72.5800 }; 
  const customerCoords: Coordinates = { lat: 23.0225, lng: 72.5714 };

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

  return (
    <div className="min-h-screen flex flex-col bg-background relative pb-[100px]">
      {/* Header Over Map */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-10 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <Link 
          href="/orders"
          className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md flex items-center gap-1.5 text-white pointer-events-auto transition-transform active:scale-95 hover:bg-black/60 text-xs font-bold"
        >
          <span>All Orders</span>
        </Link>
        <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-mono font-bold pointer-events-auto shadow-sm">
          #{order.id.substring(0, 8).toUpperCase()}
        </div>
      </div>

      {/* Map Segment */}
      <div className="relative w-full" style={{ height: '36vh' }}>
        <OrderTrackingMap 
          farmLocation={farmCoords} 
          customerLocation={customerCoords} 
          driverLocation={undefined} 
          height="100%" 
        />
      </div>

      {/* Main Content Area */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-surface rounded-t-2xl shadow-xl border-t border-border z-20 -mt-6 relative flex-1 flex flex-col gap-4 p-4 pt-4 w-full max-w-2xl mx-auto"
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-1" />

        {/* Status Header */}
        <div className="flex justify-between items-end border-b border-border/60 pb-4">
          <div>
            <h2 className="text-xl font-black text-foreground mb-0.5">
              {order.status === 'delivered' ? 'Order Delivered' : 
               order.status === 'out_for_delivery' ? 'Out for Delivery' : 
               'Preparing at Farm'}
            </h2>
            <p className="text-muted text-xs">
              Delivery expected by {new Date(order.delivery_date || Date.now()).toLocaleDateString()} • 6:30 AM
            </p>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/20">
            {order.status.replace(/_/g, ' ')}
          </div>
        </div>

        {/* Timeline */}
        <OrderStatusTimeline currentStatus={order.status} />

        {/* Delivery Address Summary */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <h3 className="font-bold text-foreground text-xs flex items-center mb-2 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary" /> {addressLabel}
          </h3>
          <p className="text-muted text-xs leading-relaxed">
            {addressText}
          </p>
        </div>

        {/* Order Items */}
        <OrderItemsReview order={order} />
        
        {/* Freshness Assurance */}
        <div className="bg-surface rounded-xl p-3.5 border border-border flex items-start gap-2.5 text-xs">
          <ThermometerSnowflake className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-foreground mb-0.5">Cold-Chain Guaranteed (4°C)</h4>
            <p className="text-muted text-[11px] leading-relaxed">Transported in temperature-controlled chilled insulation direct from the farm.</p>
          </div>
        </div>
      </motion.div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border p-3 pb-safe shadow-lg">
        <div className="max-w-2xl mx-auto flex gap-2.5">
          <button 
            className="flex-1 py-2.5 px-4 rounded-xl border border-border font-bold text-xs text-foreground hover:bg-surface-muted transition-colors cursor-pointer" 
            onClick={() => router.push('/support')}
          >
            Need Help?
          </button>
          <button 
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover font-bold text-xs text-foreground-inverse flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm" 
            onClick={handleReorder}
          >
            <Repeat className="w-3.5 h-3.5" /> Reorder Items
          </button>
        </div>
      </div>
    </div>
  );
}
