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

  // Hide on checkout, auth, or if empty
  const hideOn = ['/checkout', '/order-confirmed', '/login', '/onboarding'];
  const isHidden = hideOn.some(p => pathname.startsWith(p)) || isEmpty || isLoading;

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          key="floating-cart-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="fixed z-40 left-4 right-4 md:left-auto md:right-8 md:w-[320px]"
          style={{ bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))' }}
        >
          <button 
            onClick={onOpen}
            className="w-full flex items-center justify-between rounded-[16px] px-5 py-4 transition-all active:scale-[0.98] hover:brightness-105"
            style={{
              background: 'var(--cta-gradient)',
              boxShadow: '0 8px 24px rgba(63, 101, 48, 0.35)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-white/20 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col items-start">
                <p className="text-white font-bold text-[14px] leading-tight">
                  {totalItems} {t('items')}
                </p>
                <p className="text-white/80 font-semibold text-[12px]">
                  {t('currency')}{subtotal}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-white font-bold text-[13px]">
              {t('viewCart')} <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
