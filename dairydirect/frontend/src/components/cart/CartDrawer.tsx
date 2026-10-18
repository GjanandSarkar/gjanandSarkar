"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { useCartDetails } from '@/hooks/useCartDetails';
import { OrderSummary } from './OrderSummary';
import { EmptyCart } from './EmptyCart';
import { updateCartItem, removeFromCart, clearCart as apiClearCart } from '@/lib/api/cart';
import { useRouter, usePathname } from 'next/navigation';
import { CartCrossSells } from '@/components/discovery/CartCrossSells';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';
import { categoryBg } from '@/lib/constants/categories';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const updateMedia = () => setIsDesktop(window.innerWidth >= 768);
    updateMedia();
    window.addEventListener('resize', updateMedia);
    return () => window.removeEventListener('resize', updateMedia);
  }, []);

  const user = useStore(s => s.user);
  const updateCartQuantityLocal = useStore(s => s.updateCartQuantityLocal);
  const removeFromCartLocal = useStore(s => s.removeFromCartLocal);
  const clearCartLocal = useStore(s => s.clearCartLocal);

  const {
    cartItemsData,
    subtotal,
    delivery,
    total,
    isFreeDelivery,
    deliveryProgress,
    neededForFree,
    isLoading,
    isEmpty
  } = useCartDetails();

  // Close drawer if navigating to checkout or cart
  useEffect(() => {
    if (pathname.includes('/checkout') || pathname === '/cart') {
      onClose();
    }
  }, [pathname, onClose]);

  // Accessibility: Focus trap, Escape key to close, Body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // Body scroll lock
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap for Tab key
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Initial focus on open
    const focusTimeout = setTimeout(() => {
      if (drawerRef.current) {
        const closeBtn = drawerRef.current.querySelector<HTMLElement>('[data-autofocus]');
        if (closeBtn) closeBtn.focus();
      }
    }, 300); // Wait for animation

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(focusTimeout);
    };
  }, [isOpen, onClose]);

  const handleUpdateQuantity = async (productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCartLocal(productId, variantId);
      if (user) await removeFromCart(user.id, productId, variantId);
    } else {
      updateCartQuantityLocal(productId, variantId, quantity);
      if (user) await updateCartItem(user.id, productId, variantId, quantity);
    }
  };

  const handleRemove = async (productId: string, variantId: string) => {
    removeFromCartLocal(productId, variantId);
    if (user) await removeFromCart(user.id, productId, variantId);
  };

  const handleClearAll = async () => {
    clearCartLocal();
    if (user) await apiClearCart(user.id);
  };

  const getCategoryBg = (category: string) => categoryBg(category);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cart-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}

      {isOpen && (
        <motion.div
          key="cart-drawer-panel"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-title"
          initial={isDesktop ? { x: '100%', y: 0 } : { y: '100%', x: 0 }}
          animate={{ x: 0, y: 0 }}
          exit={isDesktop ? { x: '100%', y: 0 } : { y: '100%', x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed z-[60] bottom-0 left-0 right-0 h-[88vh] bg-surface rounded-t-2xl md:top-0 md:bottom-0 md:left-auto md:right-0 md:h-full md:w-[420px] md:rounded-none flex flex-col shadow-2xl border-t md:border-t-0 md:border-l border-border"
        >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/80 shrink-0">
          <div>
            <h2 id="cart-title" className="font-extrabold text-lg sm:text-xl text-foreground">
              {t('myCart')}
            </h2>
            {!isEmpty && (
              <p className="text-xs text-muted font-medium">
                {cartItemsData.length} {t('items')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {!isEmpty && (
              <button 
                onClick={handleClearAll}
                aria-label={t('clearAll')}
                className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                {t('clearAll')}
              </button>
            )}
            <button 
              onClick={onClose}
              data-autofocus
              aria-label="Close cart drawer"
              className="w-8 h-8 rounded-lg bg-surface-muted hover:bg-border/60 flex items-center justify-center text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-6">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-xl animate-pulse bg-surface-muted border border-border/50" />
              ))}
            </div>
          ) : isEmpty ? (
            <EmptyCart onActionClick={onClose} />
          ) : (
            <div className="flex flex-col gap-5">
              {/* Items List */}
              <div className="flex flex-col gap-2.5">
                <AnimatePresence initial={false}>
                  {cartItemsData.map((item) => (
                    <motion.div
                      key={`${item.productId}-${item.variantId}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex gap-3.5 p-3 rounded-xl bg-surface-muted/40 border border-border/80 hover:border-border transition-colors"
                    >
                      <div 
                        className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-surface-muted border border-border/60 p-1"
                      >
                        <img src={item.product.image_url ?? PLACEHOLDER_PRODUCT_IMAGE} alt={item.product.name} className="w-full h-full object-contain" />
                      </div>

                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-bold text-xs sm:text-sm leading-tight text-foreground line-clamp-1">
                            {item.product.name}
                          </h3>
                          <button
                            onClick={() => handleRemove(item.productId, item.variantId)}
                            aria-label={`Remove ${item.product.name} from cart`}
                            className="p-1 text-muted hover:text-rose-500 transition-colors rounded-md shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary w-fit mt-0.5 mb-1.5">
                          {item.variant.weight}
                        </span>

                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm sm:text-base text-primary tabular-nums">
                            {t('currency')}{item.variant.price * item.quantity}
                          </span>

                          <div className="flex items-center rounded-lg bg-surface border border-border shadow-2xs">
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                              aria-label={`Decrease quantity of ${item.product.name}`}
                              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-foreground hover:text-primary active:scale-95 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                            <span 
                              className="w-6 text-center text-xs font-black text-foreground tabular-nums select-none"
                              aria-live="polite"
                              aria-label={`Quantity: ${item.quantity}`}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              aria-label={`Increase quantity of ${item.product.name}`}
                              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-foreground hover:text-primary active:scale-95 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Cross Sells (Inside scrollable container so user items aren't pushed off-screen) */}
              <div className="pt-2 border-t border-border/60">
                <CartCrossSells />
              </div>

              {/* Order Summary */}
              <OrderSummary 
                subtotal={subtotal}
                delivery={delivery}
                total={total}
                isFreeDelivery={isFreeDelivery}
                deliveryProgress={deliveryProgress}
                neededForFree={neededForFree}
                isDrawer={true}
              />
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {!isEmpty && !isLoading && (
          <div 
            className="p-4 sm:p-5 border-t border-border/80 bg-surface shrink-0"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
            <button
              onClick={() => {
                onClose();
                router.push('/checkout');
              }}
              aria-label="Proceed to checkout"
              className="flex items-center justify-between w-full px-5 py-3.5 rounded-xl font-black text-sm sm:text-base bg-primary hover:bg-primary-hover text-foreground-inverse transition-transform active:scale-[0.98] shadow-md cursor-pointer"
            >
              <span>{t('proceedToCheckout')}</span>
              <div className="flex items-center gap-1.5 tabular-nums">
                <span>{t('currency')}{total}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </motion.div>
      )}
    </AnimatePresence>
  );
}
