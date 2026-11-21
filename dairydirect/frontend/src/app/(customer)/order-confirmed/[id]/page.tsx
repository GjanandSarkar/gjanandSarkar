"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
<<<<<<< HEAD
import { Check, Package, MapPin, Leaf, ArrowRight, Loader2, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/Button';
=======
import { Check, Package, MapPin, Clock, ArrowRight, Loader2 } from 'lucide-react';
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
import { useTranslation } from '@/lib/i18n';
import { getOrderById } from '@/lib/api/orders';
import type { OrderWithItems } from '@/lib/api/orders';
import { useStore } from '@/store/useStore';
import { trackProductEvent } from '@/lib/analytics/session';

export default function OrderConfirmedScreen() {
  const { id } = useParams() as { id: string };
  const { t } = useTranslation();
  
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // When order completes, clear local checkout state for safety
  const setCheckoutAddressId = useStore(state => state.setCheckoutAddressId);
  const setCheckoutPaymentMethod = useStore(state => state.setCheckoutPaymentMethod);

  useEffect(() => {
    setCheckoutAddressId(null);
    setCheckoutPaymentMethod('razorpay');
    
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
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-3 text-xs text-muted font-medium">Confirming order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background px-4 text-center">
        <Package className="w-12 h-12 text-muted mb-3 opacity-50" />
        <h1 className="text-lg font-bold text-foreground mb-1">Order Not Found</h1>
        <p className="text-muted text-xs mb-5">We couldn't locate the details for this order.</p>
        <Link href="/home" className="px-5 py-2.5 bg-primary text-foreground-inverse font-bold text-xs rounded-xl">
          Return to Home
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
    <div className="flex flex-col min-h-screen bg-background text-foreground py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto w-full flex flex-col items-center">
        {/* Success Icon */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
<<<<<<< HEAD
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="w-24 h-24 bg-primary text-on-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-active"
=======
          transition={{ type: "spring", damping: 15, stiffness: 250 }}
          className="w-16 h-16 bg-primary text-foreground-inverse rounded-full flex items-center justify-center mb-4 shadow-sm"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        >
          <Check className="w-8 h-8 stroke-[3]" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-6"
        >
<<<<<<< HEAD
          <h1 className="text-[26px] font-semibold text-dark mb-2">Order Confirmed!</h1>
          <p className="text-muted text-sm font-medium">Your order has been placed successfully.</p>
          <div className="inline-block bg-sand/30 px-3 py-1 rounded-full mt-3">
            <span className="text-xs font-bold text-dark uppercase tracking-wider">Order #{order.id.substring(0, 8)}</span>
=======
          <h1 className="text-xl sm:text-2xl font-black text-foreground mb-1">Order Placed Successfully!</h1>
          <p className="text-muted text-xs">Thank you for your order. We are preparing it for delivery.</p>
          <div className="inline-block bg-surface-muted border border-border px-3 py-1 rounded-full mt-2.5">
            <span className="text-[11px] font-mono font-bold text-muted">Order ID: #{order.id.substring(0, 8).toUpperCase()}</span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </div>
        </motion.div>

        {/* Delivery ETA Card */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="w-full bg-surface border border-border rounded-xl p-4 mb-3 flex items-start gap-3"
        >
<<<<<<< HEAD
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
=======
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-xs uppercase tracking-wider mb-0.5">Estimated Delivery</h3>
            <p className="text-primary font-bold text-sm">Tomorrow Morning • 6:30 AM</p>
            <p className="text-[11px] text-muted mt-0.5">Farm fresh chilled delivery to your door</p>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </div>
        </motion.div>

        {/* Order Details Card */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
<<<<<<< HEAD
          transition={{ delay: 0.4 }}
          className="bg-surface border border-sand rounded-[20px] p-5 shadow-sm mb-4"
=======
          transition={{ delay: 0.35 }}
          className="w-full bg-surface border border-border rounded-xl p-4 mb-3 space-y-3"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        >
          <div className="flex justify-between items-center pb-2.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Order Summary</span>
            </div>
            <span className="text-sm font-extrabold text-primary tabular-nums">
              {t('currency')}{order.total_amount}
            </span>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <MapPin className="w-4 h-4 text-muted shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-foreground block capitalize">{addressLabel}</span>
              <p className="text-xs text-muted leading-relaxed mt-0.5">{addressText}</p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
<<<<<<< HEAD
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 mt-2"
=======
          transition={{ delay: 0.45 }}
          className="w-full flex flex-col gap-2.5 mt-2"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        >
          <Link href={`/tracking/${order.id}`} className="block w-full">
            <button className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-foreground-inverse font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer">
              <span>Track Order Live</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
          <Link href="/home" className="block w-full text-center py-2.5">
            <span className="text-xs font-semibold text-muted hover:text-foreground transition-colors">
              Continue Shopping
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
