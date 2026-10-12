"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MessageSquare, Star, Info, MapPin, Repeat, ThermometerSnowflake, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-surface-container relative pb-[120px]">
      {/* Header Over Map */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-12 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto transition-transform active:scale-95 hover:bg-white/30"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white text-[13px] font-bold pointer-events-auto shadow-sm">
          Order #{order.id.substring(0, 8)}
        </div>
      </div>

      {/* Map Segment */}
      <div className="relative w-full" style={{ height: '40vh' }}>
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
        className="bg-cream rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-20 -mt-8 relative flex-1 flex flex-col gap-6 p-4 pt-6"
      >
        <div className="w-12 h-1.5 bg-sand rounded-full mx-auto mb-2" />

        {/* Status Header */}
        <div className="flex justify-between items-end border-b border-sand pb-6">
          <div>
            <h2 className="text-2xl font-black text-dark mb-1">
              {order.status === 'delivered' ? 'Delivered' : 
               order.status === 'out_for_delivery' ? 'Arriving Soon' : 
               'Preparing'}
            </h2>
            <p className="text-muted text-sm font-medium">
              Expected by {new Date(order.delivery_date || Date.now()).toLocaleDateString()}
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-mint/20 text-primary text-xs font-bold uppercase tracking-wide border border-mint/50">
            {order.status.replace(/_/g, ' ')}
          </div>
        </div>

        {/* Driver Profile (Only if out for delivery) */}
        {order.status === 'out_for_delivery' && (
          <div className="flex items-center justify-center bg-gray-100 p-4 rounded-[20px] border border-gray-200 shadow-inner">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-bold tracking-wide">Live Driver GPS: NOT CONFIGURED</span>
            </div>
          </div>
        )}

        {/* Timeline */}
        <OrderStatusTimeline currentStatus={order.status} />

        {/* Delivery Address Summary */}
        <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-sand">
          <h3 className="font-bold text-dark text-sm flex items-center mb-3 uppercase tracking-wider">
            <MapPin className="w-4 h-4 mr-2 text-primary" /> {addressLabel}
          </h3>
          <p className="text-muted text-sm leading-relaxed font-medium">
            {addressText}
          </p>
        </div>

        {/* Order Items */}
        <OrderItemsReview order={order} />
        
        {/* Trust & Freshness Assurance */}
        <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-[20px] p-5">
          <h3 className="font-bold text-dark text-[13px] uppercase tracking-wider mb-3 flex items-center gap-2">
            <ThermometerSnowflake className="w-4 h-4 text-blue-600" />
            Freshness Guaranteed
          </h3>
          <p className="text-[12px] text-muted leading-relaxed mb-4">
            Your GjanandSarkar order is being transported at an optimal 4°C to lock in freshness. We ensure safe, contactless delivery straight from our farms.
          </p>
          <div className="flex gap-2 items-center text-[11px] font-bold text-dark bg-white rounded-lg p-2 border border-sand">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            Need help? Our support team is ready.
          </div>
        </div>

      </motion.div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-sand p-4 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:left-[260px]">
        <div className="max-w-[800px] mx-auto flex gap-3">
          <Button variant="outline" className="flex-1 shadow-sm font-bold text-sm h-14" onClick={() => router.push('/support')}>
            Need Help?
          </Button>
          <Button className="flex-1 shadow-active font-bold text-sm h-14" onClick={handleReorder}>
            <Repeat className="w-4 h-4 mr-2" /> Reorder Items
          </Button>
        </div>
      </div>
    </div>
  );
}
