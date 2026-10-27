"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Package, MapPin, Leaf, ArrowRight, Loader2, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n';
import { getOrderById } from '@/lib/api/orders';
import type { OrderWithItems } from '@/lib/api/orders';
import { useStore } from '@/store/useStore';
import { trackProductEvent } from '@/lib/analytics/session';

export default function OrderConfirmedScreen() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { t } = useTranslation();
  
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // When order completes, clear local checkout state for safety
  const setCheckoutAddressId = useStore(state => state.setCheckoutAddressId);
  const setCheckoutPaymentMethod = useStore(state => state.setCheckoutPaymentMethod);

  useEffect(() => {
    setCheckoutAddressId(null);
    setCheckoutPaymentMethod('upi');
    
    getOrderById(id).then(res => {
      setOrder(res);
      setIsLoading(false);

      // Purchase is the strongest recommendation signal there is, and the
      // only place it can be captured client-side is here, once the order is
      // known to exist. Guarded by a per-order key so a refresh of this page
      // cannot inflate the same purchase into several events.
      if (res) {
        const key = `gj_purchase_tracked_${id}`;
        try {
          if (!window.sessionStorage.getItem(key)) {
            window.sessionStorage.setItem(key, '1');
            for (const item of res.order_items ?? []) {
              if (item.product_id) {
                trackProductEvent(item.product_id, 'purchase', {
                  source: 'order_confirmed',
                  quantity: item.quantity ?? 1,
                });
              }
            }
          }
        } catch {
          // Storage unavailable: skip tracking rather than risk duplicates.
        }
      }
    });
  }, [id, setCheckoutAddressId, setCheckoutPaymentMethod]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-xs text-muted font-medium">Confirming Details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-cream px-6 text-center">
        <Package className="w-16 h-16 text-muted mb-4 opacity-50" />
        <h1 className="text-xl font-bold text-dark mb-2">Order Not Found</h1>
        <p className="text-muted text-sm mb-6">We couldn't find the details for this order.</p>
        <Link href="/home">
          <Button className="shadow-active">Return Home</Button>
        </Link>
      </div>
    );
  }

  const addressLabel = order.user_addresses?.label || 'Delivery Address';
  const addressText = order.user_addresses?.address || 'Details unavailable';

  const isCod = (order.payment_method || '').toUpperCase() === 'COD';
  const paymentLabel = isCod
    ? 'Cash on Delivery (COD)'
    : (order.payment_method || '').toLowerCase() === 'razorpay'
    ? 'Online Payment (Razorpay)'
    : order.payment_method || 'Cash on Delivery';

  return (
    <div className="flex flex-col min-h-screen bg-cream relative overflow-hidden">
      <div className="flex-1 flex flex-col pt-16 px-6 relative z-10 pb-20 max-w-lg mx-auto w-full">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="w-24 h-24 bg-primary text-on-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-active"
        >
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-[26px] font-semibold text-dark mb-2">Order Confirmed!</h1>
          <p className="text-muted text-sm font-medium">Your order has been placed successfully.</p>
          <div className="inline-block bg-sand/30 px-3 py-1 rounded-full mt-3">
            <span className="text-xs font-bold text-dark uppercase tracking-wider">Order #{order.id.substring(0, 8)}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-mint/20 border border-mint/50 rounded-[20px] p-5 flex items-start gap-4 mb-4 shadow-sm"
        >
          <div className="bg-surface rounded-full p-2.5 shrink-0 shadow-sm text-primary">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-dark text-sm mb-1 mt-0.5 uppercase tracking-wider">Total Amount</h3>
            <p className="text-primary font-semibold text-lg tracking-wide">{t('currency')}{order.total_amount}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-surface border border-sand rounded-[20px] p-5 shadow-sm mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="bg-sand/30 rounded-full p-2.5 shrink-0 text-primary">
                {isCod ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-dark text-xs uppercase tracking-wider mb-0.5">Payment Method</h3>
                <p className="text-dark font-semibold text-sm">
                  {paymentLabel}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              order.payment_status === 'paid' 
                ? 'bg-mint text-primary' 
                : 'bg-sand/40 text-muted'
            }`}>
              {order.payment_status === 'paid' ? 'Paid' : 'Pay on Delivery'}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-surface border border-sand rounded-[20px] p-5 shadow-sm mb-4"
        >
          <h3 className="font-bold text-dark text-sm flex items-center mb-3 uppercase tracking-wider">
            <MapPin className="w-4 h-4 mr-2 text-primary" /> {addressLabel}
          </h3>
          <p className="text-muted text-sm leading-relaxed font-medium">
            {addressText}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 mt-2"
        >
          <Link href={`/tracking/${order.id}`} className="block w-full">
            <Button size="lg" className="w-full shadow-active text-base flex justify-center items-center gap-2">
              Track Order <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/home" className="block w-full text-center py-4">
            <span className="text-sm font-bold text-muted hover:text-dark transition-colors">
              Continue Shopping
            </span>
          </Link>
        </motion.div>
      </div>

      {/* Floating Leaves Animation Element (bg) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          initial={{ y: -100, x: -50, rotate: 0 }}
          animate={{ y: 800, x: 200, rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-1/4 opacity-[0.07] text-mint"
        >
          <Leaf className="w-16 h-16" />
        </motion.div>
        <motion.div 
          initial={{ y: -50, x: 300, rotate: 0 }}
          animate={{ y: 900, x: 100, rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 right-1/4 opacity-[0.05] text-mint"
        >
          <Leaf className="w-24 h-24" />
        </motion.div>
      </div>
    </div>
  );
}
