"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, ArrowRight, ChevronUp } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getProducts } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';
import { useTranslation } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

export function CartBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const cart = useStore(state => state.cart);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);

  useEffect(() => {
    getProducts({ activeOnly: true }).then(setProducts);
  }, []);

  const cartTotal = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    const variant = product?.product_variants?.find(v => v.id === item.variantId);
    return sum + (variant?.price || 0) * item.quantity;
  }, 0);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Don't show on cart/checkout pages or when empty
  const hideOn = ['/cart', '/checkout', '/order-confirmed'];
  const isHidden = hideOn.some(p => pathname.startsWith(p)) || totalItems === 0;

  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed z-50 right-6 md:right-8"
          style={{
            bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Link href="/cart" className="relative block group">
            <motion.div
              animate={{
                width: isHovered ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 'calc(100vw - 48px)' : '320px') : '60px',
                height: '60px',
                borderRadius: isHovered ? '20px' : '30px',
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="flex items-center overflow-hidden whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, #3f6530 0%, #4a7a38 60%, #537e64 100%)',
                boxShadow: '0 12px 32px rgba(63, 101, 48, 0.45), 0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {/* Circular State / Icon Area */}
              <div className="flex items-center justify-center w-[60px] h-[60px] shrink-0">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-white" strokeWidth={2.2} />
                  <div 
                    className="absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-white text-[#3f6530] text-[10px] font-black border-2 border-[#3f6530]"
                  >
                    {totalItems}
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex-1 flex items-center justify-between pr-4 overflow-hidden"
                  >
                    <div className="flex flex-col">
                      <p className="text-white font-bold text-[14px] leading-tight">
                        {totalItems} item{totalItems !== 1 ? 's' : ''} • {t('currency')}{cartTotal}
                      </p>
                      <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                        View Cart <ArrowRight className="inline w-3 h-3 ml-0.5" />
                      </p>
                    </div>
                    
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                      <ChevronUp className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Visual Pulse for Circular State */}
            {!isHovered && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-white/40 pointer-events-none"
              />
            )}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
