"use client";

import { useTranslation } from '@/lib/i18n';
import { ShieldCheck, Package, Droplets, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
  onCheckout,
  isDrawer = false
}: OrderSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Free Delivery Progress */}
      <div className="bg-surface rounded-lg p-5 border border-border">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
              isFreeDelivery ? "bg-success-bg text-success" : "bg-primary-fixed text-primary"
            )}>
              {isFreeDelivery ? <ShieldCheck className="w-5 h-5" /> : <Package className="w-4.5 h-4.5" />}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground leading-tight mb-0.5">
                {isFreeDelivery ? 'Free Delivery Unlocked' : 'Free Delivery Goal'}
              </h4>
              <p className="text-xs text-foreground-muted">
                {isFreeDelivery 
                  ? 'Your order qualifies for free delivery.' 
                  : `Add items worth ₹${Math.floor(neededForFree)} more for free delivery`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="relative h-2 w-full bg-surface-muted rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${deliveryProgress}%` }}
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
          />
        </div>
      </div>

      {/* Bill Details */}
      <div className="rounded-lg p-5 bg-surface border border-border">
        <h3 className="font-semibold text-base mb-4 text-foreground">
          {t('paymentSummary')}
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">{t('subtotal')}</span>
            <span className="font-medium text-foreground">{t('currency')}{subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted">{t('deliveryFee')}</span>
            <span className="font-medium text-foreground">
              {delivery === 0 ? (
                <span className="font-semibold text-primary">{t('free')}</span>
              ) : `${t('currency')}${delivery}`}
            </span>
          </div>
          
          <div className="h-px my-1 bg-border" />
          
          <div className="flex justify-between items-center">
            <span className="font-semibold text-base text-foreground">{t('total')}</span>
            <span className="font-semibold text-lg text-primary">
              {t('currency')}{total}
            </span>
          </div>
        </div>
      </div>

      {/* ETA */}
      <div className="flex items-center gap-3 rounded-lg p-4 bg-primary-fixed border border-primary/20">
        <Clock className="w-4.5 h-4.5 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-semibold text-primary">{t('estimatedDelivery')}</p>
          <p className="text-xs font-medium text-foreground mt-0.5">
            {t('tomorrowDelivery')}
          </p>
        </div>
      </div>
    </div>
  );
}
