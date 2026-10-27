"use client";

import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useCartDetails } from '@/hooks/useCartDetails';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface FloatingCartBarProps {
  onOpen: () => void;
}

export function FloatingCartBar({ onOpen }: FloatingCartBarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { totalItems, subtotal, isEmpty, isLoading } = useCartDetails();

  // Hide on cart, checkout, order confirmed, and auth screens, or if empty.
  const hideOn = ['/cart', '/checkout', '/order-confirmed', '/login', '/onboarding'];
  const isHidden =
    hideOn.some(p => pathname.startsWith(p)) || isEmpty || isLoading;

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          key="floating-cart-bar"
          initial={{ y: 60, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="floating-cart-bar"
        >
          <button 
            onClick={onOpen}
            className="w-full min-h-[50px] flex items-center justify-between rounded-lg px-4 py-3 bg-primary text-on-primary shadow-lg hover:bg-primary-hover active:scale-[0.99] transition-all duration-150 cursor-pointer"
            aria-label="View Cart"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface/20 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-on-primary" strokeWidth={2} />
              </div>
              <div className="flex flex-col items-start">
                <p className="text-on-primary font-semibold text-sm leading-tight tabular-nums">
                  {totalItems} {t('items')}
                </p>
                <p className="text-on-primary/80 font-normal text-xs tabular-nums">
                  {t('currency')}{subtotal.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-on-primary font-medium text-sm">
              <span>{t('viewCart')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
