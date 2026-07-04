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
      <div className="bg-surface-container-lowest rounded-[20px] p-5 shadow-sm border border-outline-variant/30 overflow-hidden relative group">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                isFreeDelivery ? "bg-green-100 text-green-600" : "bg-primary-fixed text-primary"
              )}>
                {isFreeDelivery ? <ShieldCheck className="w-5 h-5" /> : <Package className="w-4.5 h-4.5" />}
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-on-surface leading-tight mb-0.5">
                  {isFreeDelivery ? 'Free Delivery Unlocked!' : 'Free Delivery Goal'}
                </h4>
                <p className="text-[11px] text-on-surface-variant font-medium">
                  {isFreeDelivery 
                    ? 'Shop worry-free, shipping is on us! 🥛' 
                    : `Add items worth ₹${Math.floor(neededForFree)} more for FREE Delivery`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="relative h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${deliveryProgress}%` }}
              className={cn(
                "absolute top-0 left-0 h-full transition-all duration-700",
                isFreeDelivery ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-primary"
              )}
            />
          </div>
        </div>
        
        {!isFreeDelivery && (
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Droplets className="w-12 h-12 text-primary" />
          </div>
        )}
      </div>

      {/* Bill Details */}
      <div className="rounded-[16px] p-5" style={{ background: 'var(--color-surface-container-lowest)' }}>
        <h3 className="font-bold text-[16px] mb-4" style={{ color: 'var(--color-on-surface)' }}>
          {t('paymentSummary')}
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-[14px]">
            <span style={{ color: 'var(--color-on-surface-variant)' }}>{t('subtotal')}</span>
            <span className="font-medium" style={{ color: 'var(--color-on-surface)' }}>{t('currency')}{subtotal}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span style={{ color: 'var(--color-on-surface-variant)' }}>{t('deliveryFee')}</span>
            <span className="font-medium" style={{ color: delivery === 0 ? 'var(--color-tertiary)' : 'var(--color-on-surface)' }}>
              {delivery === 0 ? (
              <span className="font-semibold" style={{ color: 'var(--color-tertiary)' }}>{t('free')}</span>
            ) : `${t('currency')}${delivery}`}
            </span>
          </div>
          
          <div className="h-px my-1" style={{ background: 'var(--color-outline-variant)', opacity: 0.4 }} />
          
          <div className="flex justify-between items-center">
            <span className="font-bold text-[16px]" style={{ color: 'var(--color-on-surface)' }}>{t('total')}</span>
            <span className="font-extrabold text-[18px]" style={{ color: 'var(--color-primary)' }}>
              {t('currency')}{total}
            </span>
          </div>
        </div>
      </div>

      {/* ETA */}
      <div className="flex items-center gap-3 rounded-[14px] p-4"
        style={{ background: 'var(--color-tertiary-fixed)' }}>
        <Clock className="w-4.5 h-4.5 shrink-0" style={{ color: 'var(--color-tertiary)' }} />
        <div>
          <p className="text-[12px] font-bold" style={{ color: 'var(--color-tertiary)' }}>{t('estimatedDelivery')}</p>
          <p className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--color-on-surface)' }}>
            {t('tomorrowDelivery')}
          </p>
        </div>
      </div>
    </div>
  );
}
