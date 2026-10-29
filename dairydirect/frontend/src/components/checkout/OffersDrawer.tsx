"use client";

import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CouponItem {
  id: string;
  code: string;
  type: 'flat' | 'percentage';
  discount_amount: number;
  min_order_amount: number;
  max_discount?: number | null;
  valid_until?: string | null;
  description?: string;
  is_active?: boolean;
}

interface OffersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartSubtotal: number;
  appliedCouponCode?: string;
  onApplyCoupon: (code: string) => void;
}

export function OffersDrawer({
  isOpen,
  onClose,
  cartSubtotal,
  appliedCouponCode,
  onApplyCoupon,
}: OffersDrawerProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/coupons')
      .then((res) => res.json())
      .then((data) => {
        if (data.coupons) {
          setCoupons(data.coupons);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch coupons:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-surface rounded-t-2xl sm:rounded-xl border border-border shadow-2xl z-10 max-h-[85dvh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base leading-tight">Available Offers</h3>
                <p className="text-xs text-foreground-muted font-medium mt-0.5">Apply coupon to save on your cart</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
              aria-label="Close offers"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-foreground-muted gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs font-medium">Checking available offers...</span>
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12 text-foreground-muted space-y-2">
                <p className="text-sm font-semibold text-foreground">No active coupons right now</p>
                <p className="text-xs">Check back soon for seasonal promotions and festival offers.</p>
              </div>
            ) : (
              coupons.map((coupon) => {
                const minReq = coupon.min_order_amount || 0;
                const isEligible = cartSubtotal >= minReq;
                const diff = minReq - cartSubtotal;
                const isCurrentlyApplied = appliedCouponCode?.toUpperCase() === coupon.code.toUpperCase();

                const discountLabel =
                  coupon.type === 'percentage'
                    ? `${coupon.discount_amount}% OFF${coupon.max_discount ? ` up to ₹${coupon.max_discount}` : ''}`
                    : `₹${coupon.discount_amount} FLAT OFF`;

                return (
                  <div
                    key={coupon.id}
                    className={`rounded-lg border p-4 transition-all duration-150 ${
                      isCurrentlyApplied
                        ? 'bg-success-bg/40 border-primary shadow-xs'
                        : isEligible
                        ? 'bg-surface border-border hover:border-primary/50 shadow-2xs'
                        : 'bg-surface-muted/40 border-border/60 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider border border-primary/20">
                            {coupon.code}
                          </span>
                          {isCurrentlyApplied && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Applied
                            </span>
                          )}
                        </div>

                        <p className="font-semibold text-foreground text-sm pt-1">
                          {discountLabel}
                        </p>

                        <p className="text-xs text-foreground-muted">
                          {minReq > 0
                            ? `Valid on orders above ₹${minReq}`
                            : 'No minimum order value required'}
                        </p>
                      </div>

                      <div>
                        {isCurrentlyApplied ? (
                          <span className="px-3 py-1.5 rounded-lg bg-surface text-primary border border-primary text-xs font-semibold">
                            Active
                          </span>
                        ) : isEligible ? (
                          <button
                            type="button"
                            onClick={() => {
                              onApplyCoupon(coupon.code);
                              onClose();
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
                          >
                            Apply
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-secondary tabular-nums">
                            Add ₹{Math.round(diff)} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
