"use client";

import { useEffect, useRef } from 'react';
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
          initial={{ y: '100%', x: 0 }}
          animate={{ y: 0, x: 0 }}
          exit={{ y: '100%', x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed z-[60] bottom-0 left-0 right-0 h-[85vh] bg-surface rounded-t-[24px] md:top-0 md:bottom-0 md:left-auto md:right-0 md:h-full md:w-[420px] md:rounded-none flex flex-col shadow-2xl"
        >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/30 shrink-0">
          <div>
            <h2 id="cart-title" className="font-extrabold text-[20px] text-on-surface">
              {t('myCart')}
            </h2>
            {!isEmpty && (
              <p className="text-[13px] text-on-surface-variant font-medium">
                {cartItemsData.length} {t('items')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isEmpty && (
              <button 
                onClick={handleClearAll}
                aria-label={t('clearAll')}
                className="text-[12px] font-bold text-error bg-error/10 px-3 py-1.5 rounded-full"
              >
                {t('clearAll')}
              </button>
            )}
            <button 
              onClick={onClose}
              data-autofocus
              aria-label="Close cart drawer"
              className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-[16px] animate-pulse bg-surface-container-low" />
              ))}
            </div>
          ) : isEmpty ? (
            <EmptyCart onActionClick={onClose} />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Items */}
              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {cartItemsData.map((item) => (
                    <motion.div
                      key={`${item.productId}-${item.variantId}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex gap-4 p-3 rounded-[16px] bg-surface-container-lowest border border-outline-variant/20"
                    >
                      <div 
                        className="w-16 h-16 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ background: getCategoryBg(item.product.category) }}
                      >
                        <img src={item.product.image_url ?? PLACEHOLDER_PRODUCT_IMAGE} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-[14px] leading-tight text-on-surface line-clamp-2 pr-2">
                            {item.product.name}
                          </h3>
                          <button
                            onClick={() => handleRemove(item.productId, item.variantId)}
                            aria-label={`Remove ${item.product.name} from cart`}
                            className="p-1 text-outline hover:text-error transition-colors focus-visible:outline-2 focus-visible:outline-primary rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-fixed text-primary w-fit mt-1 mb-2">
                          {item.variant.weight}
                        </span>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[15px] text-primary">
                            {t('currency')}{item.variant.price * item.quantity}
                          </span>

                          <div className="flex items-center rounded-[8px] bg-surface-container border border-outline-variant/30">
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                              aria-label={`Decrease quantity of ${item.product.name}`}
                              className="w-7 h-7 flex items-center justify-center text-primary active:scale-95 focus-visible:outline-2 focus-visible:outline-primary"
                            >
                              <Minus className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                            <span 
                              className="w-6 text-center text-[12px] font-bold text-on-surface"
                              aria-live="polite"
                              aria-label={`Quantity: ${item.quantity}`}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              aria-label={`Increase quantity of ${item.product.name}`}
                              className="w-7 h-7 flex items-center justify-center text-primary active:scale-95 focus-visible:outline-2 focus-visible:outline-primary"
                            >
                              <Plus className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Summary */}
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

        {/* Smart Commerce: Cart Cross Sells */}
        {!isLoading && (
          <div className="shrink-0 bg-surface">
            <CartCrossSells />
          </div>
        )}

        {/* Footer CTA */}
        {!isEmpty && !isLoading && (
          <div className="p-5 border-t border-outline-variant/30 bg-surface shrink-0 pb-safe">
            <button
              onClick={() => {
                onClose();
                router.push('/checkout');
              }}
              aria-label="Proceed to checkout"
              className="flex items-center justify-between w-full px-6 py-4 rounded-[16px] font-bold text-[16px] transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              style={{
                background: 'var(--cta-gradient)',
                color: 'white',
                boxShadow: '0 6px 20px rgba(12, 60, 38, 0.25)',
              }}
            >
              <span>{t('proceedToCheckout')}</span>
              <div className="flex items-center gap-2">
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
