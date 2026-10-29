"use client";

import { useRouter } from 'next/navigation';
import { SmartImage } from '@/components/ui/SmartImage';
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
    hasResolvedItems,
    loadError,
    unresolvedCount,
    refreshInventory,
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
      <div className="flex flex-col min-h-screen pt-20 px-6 bg-surface">
        <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
          <ListSkeleton rows={3} />
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <div className="flex items-center gap-3 px-5 py-4 md:px-10 md:py-6">
          <button onClick={() => router.back()} 
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center md:hidden transition-all active:scale-95 bg-surface-muted text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-2xl tracking-tight text-foreground">
            {t('myCart')}
          </h1>
        </div>
        <EmptyCart />
      </div>
    );
  }

  if (!isLoading && !hasResolvedItems) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <div className="flex items-center gap-3 px-5 py-4 md:px-10 md:py-6">
          <button onClick={() => router.back()}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center md:hidden transition-all active:scale-95 bg-surface-muted text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-2xl tracking-tight text-foreground">
            {t('myCart')}
          </h1>
        </div>

        <div className="flex flex-col items-center justify-center text-center gap-3 px-6 py-16">
          <p className="text-base font-semibold text-foreground">
            We couldn&apos;t load your cart items
          </p>
          <p className="text-sm text-foreground-muted max-w-sm">
            {loadError
              ? 'There was a problem reaching our catalogue. Your items are still saved.'
              : `${unresolvedCount} item(s) in your cart are no longer available to buy.`}
          </p>
          <button
            onClick={() => refreshInventory()}
            className="mt-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-primary text-on-primary text-sm font-semibold active:scale-95 transition-transform"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-36 md:pb-0 bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 md:px-10 md:py-7">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center md:hidden transition-all active:scale-95 bg-surface-muted text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Leaf className="w-3.5 h-3.5 md:block hidden text-primary" strokeWidth={2.5} />
              <span className="text-xs font-semibold hidden md:block text-primary">
                {t('reviewOrder')}
              </span>
            </div>
            <h1 className="font-semibold text-xl md:text-2xl tracking-tight text-foreground">
              {t('myCart')}
              <span className="ml-2 text-sm font-normal text-foreground-muted">
                ({cartItemsData.length})
              </span>
            </h1>
          </div>
        </div>
        <button onClick={handleClearAll}
          className="text-xs font-semibold px-3 py-1.5 min-h-[44px] rounded-full transition-all active:scale-95 text-error bg-error-bg">
          {t('clearAll')}
        </button>
      </div>

      {hasStockIssue && (
        <div className="mx-5 md:mx-10 mb-4 p-4 rounded-lg bg-warning-bg border border-warning text-warning flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Important: Inventory availability changed</p>
            <p className="text-xs text-warning mt-0.5">
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
                className={`flex items-center gap-4 rounded-lg p-4 overflow-hidden group bg-surface border ${
                  item.isOutOfStock
                    ? 'border-error bg-error-bg/20'
                    : item.isInsufficientStock
                    ? 'border-warning bg-warning-bg/20'
                    : 'border-border'
                }`}
              >
                {/* Product Image */}
                <div className={`w-16 h-16 md:w-18 md:h-18 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                  item.isOutOfStock ? 'grayscale opacity-75' : ''
                }`}
                  style={{ background: getCategoryBg(item.product.category) }}>
                  <SmartImage src={item.product.image_url} alt={item.product.name} width={96} height={96} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-semibold text-sm leading-tight truncate text-foreground">
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => handleRemove(item.productId, item.variantId)}
                      className="opacity-40 hover:opacity-100 transition-opacity shrink-0 p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-error"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-primary">
                      {item.variant.weight}
                    </span>

                    {item.isOutOfStock ? (
                      <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-semibold bg-error-bg text-error">
                        Out of Stock
                      </span>
                    ) : item.isInsufficientStock ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-semibold bg-warning-bg text-warning">
                          Only {item.availableStock} in stock
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.availableStock)}
                          className="text-xs font-semibold text-success hover:underline"
                        >
                          Set to {item.availableStock}
                        </button>
                      </div>
                    ) : item.availableStock <= 10 ? (
                      <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-semibold bg-warning-bg text-warning">
                        Only {item.availableStock} left
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="font-semibold text-base text-primary">
                      {t('currency')}{item.variant.price * item.quantity}
                    </span>

                    {/* Qty control */}
                    <div className="flex items-center rounded-lg bg-surface-muted overflow-hidden border border-border">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all active:scale-95 text-primary"
                        aria-label="Decrease quantity">
                        <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.availableStock}
                        className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all active:scale-95 text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        title={item.quantity >= item.availableStock ? 'Max stock reached' : undefined}
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
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
                className="flex items-center justify-between w-full px-6 py-3.5 min-h-[44px] rounded-lg font-semibold text-base transition-all active:scale-[0.98] bg-primary text-on-primary hover:bg-primary-hover shadow-xs">
                <span>{t('proceedToCheckout')}</span>
                <div className="flex items-center gap-2">
                  <span>{t('currency')}{total}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center justify-center w-full px-6 py-3.5 min-h-[44px] rounded-lg font-semibold text-sm bg-surface-muted text-foreground-muted cursor-not-allowed opacity-80"
              >
                Resolve Stock Issues to Checkout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout */}
      <div className="md:hidden fixed left-0 right-0 z-40 px-4 pb-safe bg-surface/95 backdrop-blur-md pt-3 pb-[max(env(safe-area-inset-bottom,0px),12px)] border-t border-border"
        style={{ bottom: 'calc(var(--bottom-nav-h, 64px) + env(safe-area-inset-bottom, 0px))' }}>
        {canProceedToCheckout ? (
          <Link href="/checkout"
            className="flex items-center justify-between w-full px-5 py-3.5 min-h-[44px] rounded-lg font-semibold text-sm transition-all active:scale-[0.97] bg-primary text-on-primary shadow-xs">
            <span>{t('checkout')}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-white/80 text-xs">{cartItemsData.length} {t('items')} •</span>
              <span>{t('currency')}{total}</span>
            </div>
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center justify-center w-full px-5 py-3.5 min-h-[44px] rounded-lg font-semibold text-sm bg-surface-muted text-foreground-muted cursor-not-allowed"
          >
            Resolve Stock Issues to Checkout
          </button>
        )}
      </div>
    </div>
  );
}
