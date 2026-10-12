"use client";

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { useCartDetails } from '@/hooks/useCartDetails';
import { updateCartItem, removeFromCart, clearCart as apiClearCart } from '@/lib/api/cart';
import { Trash2, ArrowLeft, Plus, Minus, ArrowRight, Leaf, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { EmptyCart } from '@/components/cart/EmptyCart';
import Link from 'next/link';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';
import { categoryBg } from '@/lib/constants/categories';
import { ListSkeleton } from '@/components/shared/Skeletons';

export default function CartScreen() {
  const { t } = useTranslation();
  const router = useRouter();

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
    isEmpty,
    hasStockIssue,
    canProceedToCheckout,
  } = useCartDetails();

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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen pt-20 px-6" style={{ background: 'var(--color-surface)' }}>
        <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
          {/* Was three flat grey bars that matched neither the row height nor
              the row layout, so the cart still jumped when items arrived. */}
          <ListSkeleton rows={3} />
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-surface)' }}>
        <div className="flex items-center gap-3 px-5 py-4 md:px-10 md:py-6">
          <button onClick={() => router.back()} 
            className="w-9 h-9 rounded-[10px] flex items-center justify-center md:hidden transition-all active:scale-95 bg-surface-container-low text-on-surface">
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="font-extrabold text-[24px] tracking-tight text-on-surface">
            {t('myCart')}
          </h1>
        </div>
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-36 md:pb-0" style={{ background: 'var(--color-surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 md:px-10 md:py-7">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center md:hidden transition-all active:scale-95 bg-surface-container-low text-on-surface">
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Leaf className="w-3 h-3 md:block hidden text-primary" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block text-primary">
                {t('reviewOrder')}
              </span>
            </div>
            <h1 className="font-extrabold text-[22px] md:text-[28px] tracking-tight text-on-surface">
              {t('myCart')}
              <span className="ml-2 text-[14px] font-normal text-outline">
                ({cartItemsData.length})
              </span>
            </h1>
          </div>
        </div>
        <button onClick={handleClearAll}
          className="text-[13px] font-semibold px-4 py-2 rounded-full transition-all active:scale-95 text-error bg-error/10">
          {t('clearAll')}
        </button>
      </div>

      {hasStockIssue && (
        <div className="mx-5 md:mx-10 mb-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Important: Inventory availability changed</p>
            <p className="text-xs text-amber-800 mt-0.5">
              One or more items in your cart exceed currently available stock. Please adjust quantities or remove out-of-stock items to proceed to checkout.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 px-5 md:px-10 md:items-start max-w-7xl mx-auto w-full">
        {/* Cart Items List */}
        <div className="flex-1 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {cartItemsData.map((item) => (
              <motion.div
                key={`${item.productId}-${item.variantId}`}
                layout
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.96, transition: { duration: 0.25 } }}
                className={`flex items-center gap-4 rounded-[16px] p-4 overflow-hidden group bg-surface-container-lowest border ${
                  item.isOutOfStock
                    ? 'border-rose-300 bg-rose-50/20'
                    : item.isInsufficientStock
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-outline-variant/30'
                }`}
              >
                {/* Product Image */}
                <div className={`w-16 h-16 md:w-18 md:h-18 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden ${
                  item.isOutOfStock ? 'grayscale opacity-75' : ''
                }`}
                  style={{ background: getCategoryBg(item.product.category) }}>
                  <img src={item.product.image_url ?? PLACEHOLDER_PRODUCT_IMAGE} alt={item.product.name} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-semibold text-[14px] leading-tight truncate text-on-surface">
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => handleRemove(item.productId, item.variantId)}
                      className="opacity-30 group-hover:opacity-100 transition-opacity shrink-0 p-1 text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-fixed text-primary">
                      {item.variant.weight}
                    </span>

                    {item.isOutOfStock ? (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-700">
                        Out of Stock
                      </span>
                    ) : item.isInsufficientStock ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800">
                          Only {item.availableStock} in stock
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.availableStock)}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                        >
                          Set to {item.availableStock}
                        </button>
                      </div>
                    ) : item.availableStock <= 10 ? (
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700">
                        Only {item.availableStock} left
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-[16px] text-primary">
                      {t('currency')}{item.variant.price * item.quantity}
                    </span>

                    {/* Qty control */}
                    <div className="flex items-center rounded-[10px] bg-surface-container overflow-hidden border border-outline-variant/30">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center transition-all active:scale-95 text-primary">
                        <Minus className="w-3 h-3" strokeWidth={2.5} />
                      </button>
                      <span className="w-7 text-center text-[13px] font-bold text-on-surface">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.availableStock}
                        className="w-8 h-8 flex items-center justify-center transition-all active:scale-95 text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        title={item.quantity >= item.availableStock ? 'Max stock reached' : undefined}
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

        {/* Order Summary Panel (Desktop) */}
        <div className="w-full md:w-[360px] lg:w-[400px] md:sticky md:top-24 shrink-0 flex flex-col gap-4">
          <OrderSummary 
            subtotal={subtotal}
            delivery={delivery}
            total={total}
            isFreeDelivery={isFreeDelivery}
            deliveryProgress={deliveryProgress}
            neededForFree={neededForFree}
          />

          <div className="hidden md:block">
            {canProceedToCheckout ? (
              <Link href="/checkout"
                className="flex items-center justify-between w-full px-6 py-4 rounded-[14px] font-bold text-[16px] transition-all active:scale-[0.98] hover:brightness-105"
                style={{
                  background: 'var(--cta-gradient)',
                  color: 'white',
                  boxShadow: 'var(--cta-shadow)',
                }}>
                <span>{t('proceedToCheckout')}</span>
                <div className="flex items-center gap-2">
                  <span>{t('currency')}{total}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center justify-center w-full px-6 py-4 rounded-[14px] font-bold text-[15px] bg-gray-200 text-gray-500 cursor-not-allowed opacity-80"
              >
                Resolve Stock Issues to Checkout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout */}
      <div className="md:hidden fixed left-0 right-0 z-40 px-4 pb-safe bg-surface/90 backdrop-blur-md pt-3 pb-[max(env(safe-area-inset-bottom,0px),12px)]"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
        {canProceedToCheckout ? (
          <Link href="/checkout"
            className="flex items-center justify-between w-full px-5 py-4 rounded-[14px] font-bold text-[15px] transition-all active:scale-[0.97]"
            style={{
              background: 'var(--cta-gradient)',
              color: 'white',
              boxShadow: 'var(--cta-shadow)',
            }}>
            <span>{t('checkout')}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-white/80 text-[13px]">{cartItemsData.length} {t('items')} •</span>
              <span>{t('currency')}{total}</span>
            </div>
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center justify-center w-full px-5 py-4 rounded-[14px] font-bold text-[14px] bg-gray-200 text-gray-500 cursor-not-allowed"
          >
            Resolve Stock Issues to Checkout
          </button>
        )}
      </div>
    </div>
  );
}
