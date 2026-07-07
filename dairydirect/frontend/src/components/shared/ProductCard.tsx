"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { addToCart, updateCartItem } from '@/lib/api/cart';
import type { ProductWithVariants } from '@/lib/api/products';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartBadge } from '@/components/discovery/SmartBadges';
import Image from 'next/image';

interface ProductCardProps {
  product: ProductWithVariants;
  priority?: boolean;
}

const categoryGradients: Record<string, { bg: string; icon: string; blob: string }> = {
  'Milk':      { bg: '#e8f4fd', icon: '#4a90d9', blob: '#bde3ff' },
  'Paneer':    { bg: '#fff8e6', icon: '#c78c2e', blob: '#ffe8a0' },
  'Ghee':      { bg: '#fef5ec', icon: '#d4712a', blob: '#ffd9b0' },
  'Buttermilk':{ bg: '#eaf6ef', icon: '#3b8a55', blob: '#b8e8c9' },
  'Curd':      { bg: '#fff8e6', icon: '#c78c2e', blob: '#ffe8a0' },
  'Lassi':     { bg: '#e8f4fd', icon: '#4a90d9', blob: '#bde3ff' },
};

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);
  const addToCartLocal = useStore((s) => s.addToCartLocal);
  const updateCartQuantityLocal = useStore((s) => s.updateCartQuantityLocal);

  const variants = product.product_variants ?? [];

  const firstVariant = variants[0];

  const [selectedVariant, setSelectedVariant] = useState(() => {
    const firstInCart = cart.find(
      (i) => i.productId === product.id
    );
    return firstInCart
      ? variants.find((v) => v.id === firstInCart.variantId) ?? firstVariant
      : firstVariant;
  });

  const [showDrawer, setShowDrawer] = useState(false);
  const [busy, setBusy] = useState(false);

  const productCartItems = cart.filter((i) => i.productId === product.id);
  const totalQuantity = productCartItems.reduce((sum, i) => sum + i.quantity, 0);
  const isInCart = totalQuantity > 0;
  const currentVariantQty =
    productCartItems.find((i) => i.variantId === (selectedVariant?.id ?? ''))?.quantity ?? 0;

  const categoryStyle = categoryGradients[product.category] ?? categoryGradients['Milk'];

  // ── Add to cart ───────────────────────────────────────────
  const handleAdd = useCallback(
    async (e: React.MouseEvent, variantId?: string) => {
      e.preventDefault();
      e.stopPropagation();

      const vid = variantId ?? selectedVariant?.id;
      if (!vid || busy) return;

      if (!variantId && variants.length > 1) {
        setShowDrawer(true);
        return;
      }

      setBusy(true);
      addToCartLocal(product.id, vid, 1);
      if (user) {
        await addToCart(user.id, product.id, vid, 1);
      }
      setBusy(false);
    },
    [selectedVariant, variants, product.id, user, addToCartLocal, busy]
  );

  // ── Update cart quantity ──────────────────────────────────
  const handleUpdate = useCallback(
    async (
      e: React.MouseEvent,
      type: 'inc' | 'dec',
      variantId?: string
    ) => {
      e.preventDefault();
      e.stopPropagation();

      if (variants.length > 1 && !variantId) {
        setShowDrawer(true);
        return;
      }

      const vid = variantId ?? selectedVariant?.id;
      if (!vid || busy) return;

      const currentQty =
        cart.find((i) => i.productId === product.id && i.variantId === vid)?.quantity ?? 0;
      const newQty = type === 'inc' ? currentQty + 1 : Math.max(0, currentQty - 1);

      setBusy(true);
      updateCartQuantityLocal(product.id, vid, newQty);
      if (user) {
        await updateCartItem(user.id, product.id, vid, newQty);
      }
      setBusy(false);
    },
    [selectedVariant, variants, product.id, user, cart, updateCartQuantityLocal, busy]
  );

  if (!firstVariant) return null;

  return (
    <>
      <div
        className="flex flex-col h-full rounded-[16px] overflow-hidden transition-all duration-250 cursor-pointer group"
        style={{
          background: 'var(--color-surface-container-lowest)',
          boxShadow: '0 2px 8px rgba(63, 101, 48, 0.04), 0 1px 2px rgba(0,0,0,0.02)',
        }}
        onClick={() => router.push(`/products/${product.id}`)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            '0 8px 24px rgba(63, 101, 48, 0.10), 0 2px 6px rgba(0,0,0,0.04)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            '0 2px 8px rgba(63, 101, 48, 0.04), 0 1px 2px rgba(0,0,0,0.02)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Image */}
        <div className="relative" style={{ paddingTop: '85%' }}>
          <div
            className="absolute inset-0 rounded-t-[16px] overflow-hidden"
            style={{ background: categoryStyle.bg }}
          >
            <div
              className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-50 blur-xl"
              style={{ background: categoryStyle.blob }}
            />

            <Image
              src={product.image_url || '/milk.png'}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              priority={priority}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).srcset = `/milk.png`;
              }}
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />

            {product.is_freshness_guarantee && (
              <div
                className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)' }}
              >
                <Sparkles className="w-2.5 h-2.5" style={{ color: 'var(--color-primary)' }} strokeWidth={2.5} />
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                  {t('fresh')}
                </span>
              </div>
            )}

            <div className={`absolute ${product.is_freshness_guarantee ? 'top-10' : 'top-2.5'} left-2.5 flex flex-col gap-1 z-10`}>
              {product.category === 'Milk' && <SmartBadge type="bestseller" />}
              {product.category === 'Ghee' && <SmartBadge type="trending" />}
              {product.category === 'Paneer' && <SmartBadge type="popular" />}
            </div>

            {isInCart && (
              <div
                className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-lg"
                style={{ background: 'var(--color-primary)' }}
              >
                {totalQuantity}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-3 pt-2.5">
          <div className="flex-1">
            <h3 className="text-[13px] font-semibold leading-tight line-clamp-2 mb-0.5"
              style={{ color: 'var(--color-on-surface)' }}>
              {product.name}
            </h3>
            <span className="text-[10px] font-medium" style={{ color: 'var(--color-outline)' }}>
              {selectedVariant.weight}{' '}
              {variants.length > 1 && `+${variants.length - 1} ${t('more')}`}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2.5">
            <span className="font-bold text-[15px] leading-none" style={{ color: 'var(--color-primary)' }}>
              {t('currency')}{selectedVariant.price}
            </span>

            {!isInCart ? (
              <button
                onClick={handleAdd}
                disabled={busy}
                className="h-8 px-5 rounded-[8px] flex items-center justify-center transition-all duration-150 active:scale-95 hover:opacity-90 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #3f6530, #577f46)',
                  color: 'white',
                  boxShadow: '0 3px 8px rgba(63, 101, 48, 0.25)',
                }}
              >
                <span className="text-[12px] font-black tracking-wide">ADD</span>
              </button>
            ) : (
              <div className="flex items-center rounded-[10px] overflow-hidden"
                style={{ background: 'var(--color-surface-container-low)' }}>
                <button
                  onClick={(e) => handleUpdate(e, 'dec')}
                  disabled={busy}
                  className="w-7 h-7 flex items-center justify-center transition-all active:scale-90"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <Minus className="w-3 h-3" strokeWidth={2.5} />
                </button>
                <span className="px-2 text-center text-[12px] font-black"
                  style={{ color: 'var(--color-on-surface)' }}>
                  {variants.length > 1 ? totalQuantity : currentVariantQty}
                </span>
                <button
                  onClick={(e) => handleUpdate(e, 'inc')}
                  disabled={busy}
                  className="w-7 h-7 flex items-center justify-center transition-all active:scale-90"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <Plus className="w-3 h-3" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variant Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              onClick={() => setShowDrawer(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 rounded-t-[28px] z-[70] p-6 max-w-[430px] mx-auto"
              style={{ background: 'var(--color-surface)' }}
            >
              <div className="w-12 h-1.5 rounded-full mx-auto mb-6"
                style={{ background: 'var(--color-outline-variant)' }} />
              <div className="flex items-start gap-4 mb-6">
                <img
                  src={product.image_url ?? '/milk.png'}
                  alt={product.name}
                  className="w-16 h-16 rounded-[12px] object-cover"
                  style={{ background: categoryStyle.bg }}
                />
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>
                    {product.name}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--color-outline)' }}>
                    {t('selectSizeToAddToCart')}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {variants.map((v) => {
                  const qty = cart.find(
                    (i) => i.productId === product.id && i.variantId === v.id
                  )?.quantity ?? 0;

                  return (
                    <div key={v.id}
                      className="flex items-center justify-between p-4 rounded-[16px] border"
                      style={{
                        background: 'var(--color-surface-container-lowest)',
                        borderColor: qty > 0 ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold" style={{ color: 'var(--color-on-surface)' }}>{v.weight}</span>
                        <span className="text-sm font-black" style={{ color: 'var(--color-primary)' }}>
                          {t('currency')}{v.price}
                        </span>
                        {v.original_price && (
                          <span className="text-xs line-through" style={{ color: 'var(--color-outline)' }}>
                            {t('currency')}{v.original_price}
                          </span>
                        )}
                      </div>

                      {qty === 0 ? (
                        <button
                          onClick={(e) => handleAdd(e, v.id)}
                          disabled={busy}
                          className="px-6 py-2 rounded-full font-bold text-sm text-white active:scale-95 disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #3f6530, #577f46)' }}
                        >
                          {t('addShortcut')}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 px-1 py-1 rounded-full border border-primary/20"
                          style={{ background: 'var(--color-primary-fixed)' }}>
                          <button
                            onClick={(e) => handleUpdate(e, 'dec', v.id)}
                            disabled={busy}
                            className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                            style={{ background: 'white', color: 'var(--color-primary)' }}
                          >
                            <Minus className="w-4 h-4" strokeWidth={3} />
                          </button>
                          <span className="w-4 text-center text-sm font-bold"
                            style={{ color: 'var(--color-on-surface)' }}>{qty}</span>
                          <button
                            onClick={(e) => handleUpdate(e, 'inc', v.id)}
                            disabled={busy}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm disabled:opacity-50"
                            style={{ background: 'var(--color-primary)' }}
                          >
                            <Plus className="w-4 h-4" strokeWidth={3} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowDrawer(false)}
                className="w-full py-4 rounded-[18px] font-bold text-white active:scale-95"
                style={{ background: 'var(--color-on-surface)' }}
              >
                {t('done')}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
