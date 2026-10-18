"use client";

import { useTranslation } from '@/lib/i18n';
import { ShieldCheck, Truck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderSummaryProps {
  subtotal: number;
  delivery: number;
  total: number;
  isFreeDelivery: boolean;
  deliveryProgress: number;
  neededForFree: number;
  onCheckout?: () => void;
  isDrawer?: boolean;
}

export function OrderSummary({
  subtotal,
  delivery,
  total,
  isFreeDelivery,
  deliveryProgress,
  neededForFree,
}: OrderSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Free Delivery Goal */}
      <div className="bg-surface rounded-xl p-3.5 border border-border">
        <div className="flex items-center gap-2.5 mb-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isFreeDelivery ? 'bg-primary/10 text-primary' : 'bg-surface-muted text-muted'
          }`}>
            {isFreeDelivery ? <ShieldCheck className="w-4 h-4 text-primary" /> : <Truck className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-foreground leading-tight">
              {isFreeDelivery ? 'Free Delivery Unlocked' : 'Free Delivery Goal'}
            </h4>
            <p className="text-[11px] text-muted font-medium truncate">
              {isFreeDelivery 
                ? 'Free delivery applied on this order' 
                : `Add items worth ₹${Math.ceil(neededForFree)} more for FREE delivery`}
            </p>
          </div>
        </div>
        
        <div className="relative h-1.5 w-full bg-surface-muted rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${deliveryProgress}%` }}
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
              isFreeDelivery ? 'bg-primary' : 'bg-primary/80'
            }`}
          />
        </div>
      </div>

      {/* Bill Details */}
      <div className="rounded-xl p-4 bg-surface border border-border">
        <h3 className="font-bold text-sm text-foreground mb-3 pb-2 border-b border-border/60">
          {t('paymentSummary')}
        </h3>
        <div className="flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between text-muted">
            <span>{t('subtotal')}</span>
            <span className="font-semibold text-foreground tabular-nums">{t('currency')}{subtotal}</span>
          </div>

          <div className="flex justify-between text-muted">
            <span>{t('deliveryFee')}</span>
            <span className={`font-semibold tabular-nums ${delivery === 0 ? 'text-primary' : 'text-foreground'}`}>
              {delivery === 0 ? t('free') : `${t('currency')}${delivery}`}
            </span>
          </div>
          
          <div className="h-px bg-border/80 my-1" />
          
          <div className="flex justify-between items-center text-sm font-bold pt-0.5">
            <span className="text-foreground">{t('total')}</span>
            <span className="text-base font-extrabold text-primary tabular-nums">
              {t('currency')}{total}
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Guarantee Strip */}
      <div className="flex items-center gap-2.5 rounded-xl p-3 bg-surface-muted border border-border text-xs">
        <Clock className="w-4 h-4 shrink-0 text-muted" />
        <div className="min-w-0">
          <p className="font-bold text-foreground text-[11px] leading-tight">{t('estimatedDelivery')}</p>
          <p className="text-muted text-[11px] font-medium truncate mt-0.5">
            {t('tomorrowDelivery')}
          </p>
        </div>
      </div>
    </div>
  );
}
