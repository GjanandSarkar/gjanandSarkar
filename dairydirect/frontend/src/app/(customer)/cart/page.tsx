"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { getProducts } from '@/lib/api/products';
import { updateCartItem, removeFromCart, clearCart as apiClearCart } from '@/lib/api/cart';
import type { ProductWithVariants } from '@/lib/api/products';
import { Trash2, ArrowLeft, Plus, Minus, Tag, ShoppingBag, Clock, ArrowRight, Leaf, Droplets, Package, Cylinder, CupSoda, GlassWater, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function CartScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const user = useStore(s => s.user);
  const cart = useStore(s => s.cart);
  const updateCartQuantityLocal = useStore(s => s.updateCartQuantityLocal);
  const removeFromCartLocal = useStore(s => s.removeFromCartLocal);
  const clearCartLocal = useStore(s => s.clearCartLocal);

  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({ free_delivery_threshold: 299, delivery_cost: 25 });

  useEffect(() => {
    getProducts({ activeOnly: true }).then(data => {
      setProducts(data);
      setIsLoading(false);
    });
  }, []);

  const cartItemsData = useMemo(() => {
    return cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      const variant = product?.product_variants?.find(v => v.id === item.variantId);
      return product && variant ? { ...item, product, variant } : null;
    }).filter(Boolean) as ({
      productId: string;
      variantId: string;
      quantity: number;
      product: ProductWithVariants;
      variant: NonNullable<ProductWithVariants['product_variants']>[0];
    })[];
  }, [cart, products]);

  const subtotal = cartItemsData.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);
  const isFreeDelivery = subtotal >= settings.free_delivery_threshold;
  const delivery = subtotal > 0 ? (isFreeDelivery ? 0 : settings.delivery_cost) : 0;
  const total = subtotal + delivery;
  const deliveryProgress = Math.min((subtotal / settings.free_delivery_threshold) * 100, 100);
  const neededForFree = settings.free_delivery_threshold - subtotal;

  const handleUpdateQuantity = async (productId: string, variantId: string, quantity: number) => {
    if (quantity === 0) {
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

  const getCategoryBg = (category: string) => {
    const bgs: Record<string, string> = {
      'Milk': '#e8f4fd',
      'Paneer': '#fff8e6',
      'Ghee': '#fef5ec',
      'Buttermilk': '#eaf6ef',
      'Curd': '#fff8e6',
      'Lassi': '#e8f4fd',
    };
    return bgs[category] || '#eaf6ef';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen pt-20 px-6" style={{ background: 'var(--color-surface)' }}>
        <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-[16px] animate-pulse" style={{ background: 'var(--color-surface-container-low)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (cartItemsData.length === 0) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-surface)' }}>
        <div className="flex items-center gap-3 px-5 py-4 md:px-10 md:py-6">
          <button onClick={() => router.back()} 
            className="w-9 h-9 rounded-[10px] flex items-center justify-center md:hidden transition-all active:scale-95"
            style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)' }}>
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <h1 className="font-extrabold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
            {t('myCart')}
          </h1>
        </div>

        <div className="flex flex-col flex-1 items-center justify-center px-6 text-center pb-20">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 text-5xl"
            style={{ background: 'var(--color-surface-container-low)' }}>
            🛒
          </div>
          <h2 className="font-bold text-[22px] mb-2" style={{ color: 'var(--color-on-surface)' }}>
            {t('emptyCart')}
          </h2>
          <p className="text-sm max-w-[250px] leading-relaxed mb-8" style={{ color: 'var(--color-outline)' }}>
            {t('emptyCartSub')}
          </p>
          <Link href="/products"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[12px] font-bold text-sm transition-all active:scale-95"
            style={{ 
              background: 'linear-gradient(135deg, #3f6530, #577f46)', 
              color: 'white',
              boxShadow: '0 4px 14px rgba(63, 101, 48, 0.28)',
            }}>
            {t('browseProducts')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-36 md:pb-0" style={{ background: 'var(--color-surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 md:px-10 md:py-7">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center md:hidden transition-all active:scale-95"
            style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)' }}>
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Leaf className="w-3 h-3 md:block hidden" style={{ color: 'var(--color-primary)' }} strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden md:block" style={{ color: 'var(--color-primary)' }}>
                {t('reviewOrder')}
              </span>
            </div>
            <h1 className="font-extrabold text-[22px] md:text-[28px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
              {t('myCart')}
              <span className="ml-2 text-[14px] font-normal" style={{ color: 'var(--color-outline)' }}>
                ({cartItemsData.length})
              </span>
            </h1>
          </div>
        </div>
        <button onClick={handleClearAll}
          className="text-[13px] font-semibold px-4 py-2 rounded-full transition-all active:scale-95"
          style={{ color: 'var(--color-error)', background: 'rgba(186, 26, 26, 0.06)' }}>
          {t('clearAll')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 px-5 md:px-10 md:items-start max-w-7xl mx-auto w-full">
        {/* Cart Items List */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Free Delivery Progress */}
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-sand mb-2 overflow-hidden relative group">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    isFreeDelivery ? "bg-green-100 text-green-600" : "bg-primary-fixed text-primary"
                  )}>
                    {isFreeDelivery ? <ShieldCheck className="w-5 h-5" /> : <Package className="w-4.5 h-4.5" />}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-dark leading-tight">
                      {isFreeDelivery ? 'Free Delivery Unlocked!' : 'Free Delivery Goal'}
                    </h4>
                    <p className="text-[11px] text-muted font-medium">
                      {isFreeDelivery 
                        ? 'Shop worry-free, shipping is on us! 🥛' 
                        : `Add items worth ₹${Math.floor(neededForFree)} more for FREE Delivery`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="relative h-2 w-full bg-sand/30 rounded-full overflow-hidden">
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

          <AnimatePresence initial={false}>
            {cartItemsData.map((item) => (
              <motion.div
                key={`${item.productId}-${item.variantId}`}
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.96, transition: { duration: 0.25 } }}
                className="flex items-center gap-4 rounded-[16px] p-4 overflow-hidden group"
                style={{ background: 'var(--color-surface-container-lowest)' }}
              >
                {/* Product Image */}
                <div className="w-16 h-16 md:w-18 md:h-18 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: getCategoryBg(item.product.category) }}>
                  <img src={item.product.image_url ?? '/milk.png'} alt={item.product.name} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-semibold text-[14px] leading-tight truncate" 
                      style={{ color: 'var(--color-on-surface)' }}>
                      {item.product.name}
                    </h3>
                    <button
                      onClick={() => handleRemove(item.productId, item.variantId)}
                      className="opacity-30 group-hover:opacity-100 transition-opacity shrink-0 p-1"
                      style={{ color: 'var(--color-error)' }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-primary)' }}>
                    {item.variant.weight}
                  </span>

                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-[16px]" style={{ color: 'var(--color-primary)' }}>
                      {t('currency')}{item.variant.price * item.quantity}
                    </span>

                    {/* Qty control */}
                    <div className="flex items-center rounded-[10px] overflow-hidden"
                      style={{ background: 'var(--color-surface-container)' }}>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center transition-all active:scale-90"
                        style={{ color: 'var(--color-primary)' }}>
                        <Minus className="w-3 h-3" strokeWidth={2.5} />
                      </button>
                      <span className="w-7 text-center text-[13px] font-bold"
                        style={{ color: 'var(--color-on-surface)' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center transition-all active:scale-90"
                        style={{ color: 'var(--color-primary)' }}>
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
          <div className="rounded-[16px] p-5" style={{ background: 'var(--color-surface-container-lowest)' }}>
            <h3 className="font-bold text-[16px] mb-5" style={{ color: 'var(--color-on-surface)' }}>
              {t('paymentSummary')}
            </h3>
            <div className="flex flex-col gap-3.5">
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
              
              <div className="h-px" style={{ background: 'var(--color-outline-variant)', opacity: 0.4 }} />
              
              <div className="flex justify-between">
                <span className="font-bold text-[16px]" style={{ color: 'var(--color-on-surface)' }}>{t('total')}</span>
                <span className="font-extrabold text-[18px]" style={{ color: 'var(--color-primary)' }}>
                  {t('currency')}{total}
                </span>
              </div>
            </div>
          </div>

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

          <div className="hidden md:block">
            <Link href="/checkout/address"
              className="flex items-center justify-between w-full px-6 py-4 rounded-[14px] font-bold text-[16px] transition-all active:scale-[0.98] hover:brightness-105"
              style={{
                background: 'linear-gradient(135deg, #3f6530, #577f46)',
                color: 'white',
                boxShadow: '0 6px 20px rgba(63, 101, 48, 0.30)',
              }}>
              <span>{t('proceedToCheckout')}</span>
              <div className="flex items-center gap-2">
                <span>{t('currency')}{total}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Checkout */}
      <div className="md:hidden fixed left-0 right-0 z-40 px-4 pb-safe"
        style={{ 
          bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          background: 'rgba(250, 250, 243, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingTop: '12px',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
        }}>
        <Link href="/checkout/address"
          className="flex items-center justify-between w-full px-5 py-4 rounded-[14px] font-bold text-[15px] transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #3f6530, #577f46)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(63, 101, 48, 0.30)',
          }}>
          <span>{t('checkout')}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-white/80 text-[13px]">{cartItemsData.length} {t('items')} •</span>
            <span>{t('currency')}{total}</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
