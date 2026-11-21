"use client";

import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useCartDetails } from '@/hooks/useCartDetails';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, CheckCircle2, ShoppingBag } from 'lucide-react';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

interface FloatingCartBarProps {
  onOpen: () => void;
}

export function FloatingCartBar({ onOpen }: FloatingCartBarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const {
    totalItems,
    subtotal,
    isEmpty,
    isLoading,
    isFreeDelivery,
    neededForFree,
    cartItemsData,
  } = useCartDetails();

<<<<<<< HEAD
  // Hide on cart, checkout, order confirmed, and auth screens, or if empty.
  const hideOn = ['/cart', '/checkout', '/order-confirmed', '/login', '/onboarding'];
  const isHidden =
    hideOn.some(p => pathname.startsWith(p)) || isEmpty || isLoading;
=======
  // Hide on checkout, cart page, auth, or if empty
  const hideOn = ['/checkout', '/cart', '/order-confirmed', '/login', '/onboarding'];
  const isHidden = hideOn.some(p => pathname.startsWith(p)) || isEmpty || isLoading;
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

  if (isHidden) return null;

  // Up to 3 item image thumbnails to preview in the pill
  const previewItems = cartItemsData.slice(0, 3);

  return (
    <AnimatePresence>
<<<<<<< HEAD
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
=======
      <motion.div
        key="floating-cart-bar"
        initial={{ y: 90, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 90, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="fixed z-40 left-3 right-3 md:hidden"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex flex-col bg-surface rounded-xl shadow-lg border border-border overflow-hidden">
          {/* Top Delivery Incentive Banner */}
          <div
            className={`px-3 py-1.5 flex items-center justify-between text-[11px] font-medium border-b border-border/60 ${
              isFreeDelivery
                ? 'bg-primary/10 text-primary'
                : 'bg-surface-muted text-foreground-muted'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isFreeDelivery ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-primary">Free delivery unlocked</span>
                </>
              ) : (
                <>
                  <span>Add ₹{Math.max(0, neededForFree)} for free delivery</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-foreground-muted">15-20 mins</span>
          </div>

          {/* Main Action Strip */}
          <button
            onClick={onOpen}
            type="button"
            className="w-full flex items-center justify-between p-2.5 sm:p-3 bg-surface hover:bg-surface-muted transition-colors text-left cursor-pointer group"
          >
            {/* Left: Product preview thumbnails + Count & Subtotal */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center -space-x-1.5 shrink-0">
                {previewItems.map((item, idx) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="w-8 h-8 rounded-md bg-surface-muted border border-border overflow-hidden flex items-center justify-center shadow-2xs"
                    style={{ zIndex: 10 - idx }}
                  >
                    <img
                      src={item.product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {totalItems > previewItems.length && (
                  <div
                    className="w-8 h-8 rounded-md bg-primary-fixed text-primary text-[10px] font-bold border border-border flex items-center justify-center shadow-2xs"
                    style={{ zIndex: 5 }}
                  >
                    +{totalItems - previewItems.length}
                  </div>
                )}
              </div>

              <div className="flex flex-col min-w-0 pl-1">
                <span className="text-xs font-semibold text-foreground">
                  {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                </span>
                <span className="text-sm font-bold text-foreground">
                  ₹{subtotal}
                </span>
              </div>
            </div>

            {/* Right: Primary Brand CTA Button */}
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0">
              <span>View Cart</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            </div>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
