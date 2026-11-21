"use client";

import { useRouter } from 'next/navigation';
import { SmartImage } from '@/components/ui/SmartImage';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { useCartDetails } from '@/hooks/useCartDetails';
import { updateCartItem, removeFromCart, clearCart as apiClearCart } from '@/lib/api/cart';
import { Trash2, Plus, Minus, ArrowRight, Leaf, AlertCircle } from 'lucide-react';
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
<<<<<<< HEAD
      <div className="flex flex-col min-h-screen bg-surface">
        <div className="flex items-center gap-3 px-5 py-4 md:px-10 md:py-6">
          <button onClick={() => router.back()} 
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center md:hidden transition-all active:scale-95 bg-surface-muted text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-2xl tracking-tight text-foreground">
            {t('myCart')}
          </h1>
=======
      <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-150">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-2 w-full">
          <div className="border-b border-border/60 pb-5">
            <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">
              {t('myCart')}
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Your freshly selected farm essentials
            </p>
          </div>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
<<<<<<< HEAD
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
=======
    <div className="flex flex-col pb-36 md:pb-12 bg-background text-foreground min-h-screen transition-colors duration-150">
      {/* Standardized Page Header */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-2 w-full">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">
              {t('myCart')}
              <span className="ml-2.5 text-base sm:text-lg font-medium text-foreground-muted">
                ({cartItemsData.length} {t('items')})
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Review and proceed to farm-fresh direct delivery
            </p>
          </div>
          <button 
            onClick={handleClearAll}
            className="text-xs font-bold text-rose-500 bg-rose-500/10 px-3.5 py-2 rounded-xl hover:bg-rose-500/20 transition-colors cursor-pointer active:scale-95"
          >
            {t('clearAll')}
          </button>
        </div>
      </div>

      {/* Delivery Reassurance Strip */}
      <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto w-full mb-5">
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                Morning 6:30 AM Delivery Slot
              </p>
              <p className="text-[11px] text-muted">
                Cold-chain chilled • Direct from certified farms & dairies
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
            Fresh Guaranteed
          </span>
        </div>
<<<<<<< HEAD
        <button onClick={handleClearAll}
          className="min-h-[44px] text-xs font-semibold text-error underline-offset-2 hover:underline">
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
=======
      </div>

      {hasStockIssue && (
        <div className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto w-full mb-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-foreground flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-900 dark:text-amber-300">Inventory Notice</p>
              <p className="text-muted mt-0.5">
                One or more items in your cart exceed available inventory. Adjust quantities or remove them to proceed.
              </p>
            </div>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 px-4 sm:px-6 md:px-10 md:items-start max-w-7xl mx-auto w-full">
        {/* Cart Items List */}
        <div className="flex-1 flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {cartItemsData.map((item) => (
              <motion.div
                key={`${item.productId}-${item.variantId}`}
                layout
<<<<<<< HEAD
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.96, transition: { duration: 0.25 } }}
                className={`flex items-center gap-4 rounded-lg p-4 overflow-hidden group bg-surface border ${
=======
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                className={`flex items-center gap-3.5 p-3.5 rounded-xl bg-surface border transition-colors ${
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  item.isOutOfStock
                    ? 'border-error bg-error-bg/20'
                    : item.isInsufficientStock
<<<<<<< HEAD
                    ? 'border-warning bg-warning-bg/20'
=======
                    ? 'border-amber-300 bg-amber-50/20'
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    : 'border-border'
                }`}
              >
                {/* Product Image */}
<<<<<<< HEAD
                <div className={`w-16 h-16 md:w-18 md:h-18 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                  item.isOutOfStock ? 'grayscale opacity-75' : ''
                }`}
                  style={{ background: getCategoryBg(item.product.category) }}>
                  <SmartImage src={item.product.image_url} alt={item.product.name} width={96} height={96} className="w-full h-full object-cover" />
=======
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-surface-muted border border-border p-1 ${
                  item.isOutOfStock ? 'grayscale opacity-60' : ''
                }`}>
                  <img src={item.product.image_url ?? PLACEHOLDER_PRODUCT_IMAGE} alt={item.product.name} className="w-full h-full object-contain" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
<<<<<<< HEAD
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-semibold text-sm leading-tight truncate text-foreground">
=======
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-xs sm:text-sm leading-tight text-foreground line-clamp-1">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => handleRemove(item.productId, item.variantId)}
<<<<<<< HEAD
                      className="opacity-40 hover:opacity-100 transition-opacity shrink-0 p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-error"
                      aria-label="Remove item"
=======
                      aria-label={`Remove ${item.product.name}`}
                      className="p-1 text-muted hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
<<<<<<< HEAD
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground-muted">
=======
                  <div className="flex flex-wrap items-center gap-1.5 my-1">
                    <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                      {item.variant.weight}
                    </span>

                    {item.isOutOfStock ? (
<<<<<<< HEAD
                      <span className="text-xs font-semibold text-error">
=======
                      <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                        Out of Stock
                      </span>
                    ) : item.isInsufficientStock ? (
                      <div className="flex items-center gap-1.5">
<<<<<<< HEAD
                        <span className="text-xs font-semibold text-secondary-ink">
=======
                        <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                          Only {item.availableStock} in stock
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.availableStock)}
<<<<<<< HEAD
                          className="text-xs font-semibold text-success hover:underline"
=======
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                        >
                          Set to {item.availableStock}
                        </button>
                      </div>
                    ) : item.availableStock <= 10 ? (
<<<<<<< HEAD
                      <span className="text-xs font-semibold text-secondary-ink">
=======
                      <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-muted">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                        Only {item.availableStock} left
                      </span>
                    ) : null}
                  </div>

<<<<<<< HEAD
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
=======
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-extrabold text-sm sm:text-base text-primary tabular-nums">
                      {t('currency')}{item.variant.price * item.quantity}
                    </span>

                    {/* Stepper control */}
                    <div className="flex items-center rounded-lg bg-surface border border-border">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        aria-label={`Decrease ${item.product.name} quantity`}
                        className="w-7 h-7 flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-foreground tabular-nums select-none">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.availableStock}
<<<<<<< HEAD
                        className="w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all active:scale-95 text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        title={item.quantity >= item.availableStock ? 'Max stock reached' : undefined}
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
=======
                        aria-label={`Increase ${item.product.name} quantity`}
                        className="w-7 h-7 flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary Panel (Desktop) */}
        <div className="w-full md:w-[340px] lg:w-[380px] md:sticky md:top-24 shrink-0 flex flex-col gap-4">
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
<<<<<<< HEAD
                className="flex items-center justify-between w-full px-6 py-3.5 min-h-[44px] rounded-lg font-semibold text-base transition-all active:scale-[0.98] bg-primary text-on-primary hover:bg-primary-hover shadow-xs">
=======
                className="flex items-center justify-between w-full px-5 py-3.5 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-foreground-inverse transition-all active:scale-[0.98] shadow-sm"
              >
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                <span>{t('proceedToCheckout')}</span>
                <div className="flex items-center gap-1.5 tabular-nums">
                  <span>{t('currency')}{total}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ) : (
              <button
                disabled
<<<<<<< HEAD
                className="flex items-center justify-center w-full px-6 py-3.5 min-h-[44px] rounded-lg font-semibold text-sm bg-surface-muted text-foreground-muted cursor-not-allowed opacity-80"
=======
                className="flex items-center justify-center w-full px-5 py-3.5 rounded-xl font-bold text-sm bg-surface-muted text-muted cursor-not-allowed border border-border"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              >
                Resolve Stock Issues to Checkout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout */}
<<<<<<< HEAD
      <div className="md:hidden fixed left-0 right-0 z-40 px-4 pb-safe bg-surface/95 backdrop-blur-md pt-3 pb-[max(env(safe-area-inset-bottom,0px),12px)] border-t border-border"
        style={{ bottom: 'calc(var(--bottom-nav-h, 64px) + env(safe-area-inset-bottom, 0px))' }}>
        {canProceedToCheckout ? (
          <Link href="/checkout"
            className="flex items-center justify-between w-full px-5 py-3.5 min-h-[44px] rounded-lg font-semibold text-sm transition-all active:scale-[0.97] bg-primary text-on-primary shadow-xs">
            <span>{t('checkout')}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-white/80 text-xs">{cartItemsData.length} {t('items')} •</span>
=======
      <div 
        className="md:hidden fixed left-0 right-0 z-40 px-4 pt-3 bg-surface/95 backdrop-blur-md border-t border-border"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        {canProceedToCheckout ? (
          <Link href="/checkout"
            className="flex items-center justify-between w-full px-5 py-3 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-foreground-inverse transition-all active:scale-[0.98] shadow-sm"
          >
            <span>{t('checkout')}</span>
            <div className="flex items-center gap-1.5 tabular-nums">
              <span className="opacity-80 text-xs">{cartItemsData.length} {t('items')} •</span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              <span>{t('currency')}{total}</span>
            </div>
          </Link>
        ) : (
          <button
            disabled
<<<<<<< HEAD
            className="flex items-center justify-center w-full px-5 py-3.5 min-h-[44px] rounded-lg font-semibold text-sm bg-surface-muted text-foreground-muted cursor-not-allowed"
=======
            className="flex items-center justify-center w-full px-5 py-3 rounded-xl font-bold text-xs bg-surface-muted text-muted cursor-not-allowed border border-border"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          >
            Resolve Stock Issues to Checkout
          </button>
        )}
      </div>
    </div>
  );
}
