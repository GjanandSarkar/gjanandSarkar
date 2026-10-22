"use client";

import { useRouter } from 'next/navigation';
import { RecommendationRail } from '@/components/discovery/RecommendationRail';
import { AdSlot } from '@/components/discovery/AdSlot';
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
        </div>
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-36 md:pb-12 bg-background text-foreground min-h-screen transition-colors duration-150">
      {/* Standardized Page Header */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-2 w-full">
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">
              {t('myCart')}
              <span className="ml-2.5 text-base sm:text-lg font-medium text-foreground-muted">
                ({cartItemsData.length} {t('items')})
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
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                className={`flex items-center gap-3.5 p-3.5 rounded-xl bg-surface border transition-colors ${
                  item.isOutOfStock
                    ? 'border-rose-300 bg-rose-50/20'
                    : item.isInsufficientStock
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-border'
                }`}
              >
                {/* Product Image */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center shrink-0 overflow-hidden bg-surface-muted border border-border p-1 ${
                  item.isOutOfStock ? 'grayscale opacity-60' : ''
                }`}>
                  <img src={item.product.image_url ?? PLACEHOLDER_PRODUCT_IMAGE} alt={item.product.name} className="w-full h-full object-contain" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-xs sm:text-sm leading-tight text-foreground line-clamp-1">
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => handleRemove(item.productId, item.variantId)}
                      aria-label={`Remove ${item.product.name}`}
                      className="p-1 text-muted hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-1.5 my-1">
                    <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
                      {item.variant.weight}
                    </span>

                    {item.isOutOfStock ? (
                      <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-600">
                        Out of Stock
                      </span>
                    ) : item.isInsufficientStock ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700">
                          Only {item.availableStock} in stock
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.availableStock)}
                          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                        >
                          Set to {item.availableStock}
                        </button>
                      </div>
                    ) : item.availableStock <= 10 ? (
                      <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-muted">
                        Only {item.availableStock} left
                      </span>
                    ) : null}
                  </div>

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
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.availableStock}
                        aria-label={`Increase ${item.product.name} quantity`}
                        className="w-7 h-7 flex items-center justify-center text-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="flex items-center justify-between w-full px-5 py-3.5 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-foreground-inverse transition-all active:scale-[0.98] shadow-sm"
              >
                <span>{t('proceedToCheckout')}</span>
                <div className="flex items-center gap-1.5 tabular-nums">
                  <span>{t('currency')}{total}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center justify-center w-full px-5 py-3.5 rounded-xl font-bold text-sm bg-surface-muted text-muted cursor-not-allowed border border-border"
              >
                Resolve Stock Issues to Checkout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout */}
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
              <span>{t('currency')}{total}</span>
            </div>
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center justify-center w-full px-5 py-3 rounded-xl font-bold text-xs bg-surface-muted text-muted cursor-not-allowed border border-border"
          >
            Resolve Stock Issues to Checkout
          </button>
        )}
      </div>

      {/* Cart is the highest-intent surface on the site, which is why the
          conversions objective peaks here in ad serving. Seeded from cart
          contents rather than browsing history. */}
      <RecommendationRail placement="cart" limit={8} />
      <AdSlot placement="cart" />
    </div>
  );
}
