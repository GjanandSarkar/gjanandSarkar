"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Wallet, Banknote, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { getProducts } from '@/lib/api/products';
import { placeOrder } from '@/lib/api/orders';
import { clearCart as clearCartApi } from '@/lib/api/cart';
import type { ProductWithVariants } from '@/lib/api/products';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const user = useStore(state => state.user);
  const cart = useStore(state => state.cart);
  const clearCartLocal = useStore(state => state.clearCartLocal);
  
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);

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
    }).filter(Boolean);
  }, [cart, products]);

  const subtotal = cartItemsData.reduce((sum, item) => sum + (item!.variant.price * item!.quantity), 0);
  const delivery = subtotal > 0 ? (subtotal >= 299 ? 0 : 30) : 0;
  const total = subtotal + delivery;

  const methods = [
    { id: 'upi', name: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: Wallet },
    { id: 'card', name: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard },
    { id: 'cod', name: 'Cash on Delivery', desc: 'Pay at your doorstep', icon: Banknote },
  ];

  const handlePay = async () => {
    if (!user || cartItemsData.length === 0) return;
    setIsProcessing(true);
    
    // Simulate payment gateway delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Construct real order
    const orderItems = cartItemsData.map(item => ({
      productId: item!.productId,
      variantId: item!.variantId,
      productName: item!.product.name,
      variantWeight: item!.variant.weight,
      quantity: item!.quantity,
      price: item!.variant.price,
    }));

    const result = await placeOrder({
      userId: user.id,
      customerName: user.name || 'Customer',
      customerPhone: user.phone || '',
      items: orderItems,
      total,
    });

    if (result.success && result.orderId) {
      // Clear cart local & remote
      clearCartLocal();
      await clearCartApi(user.id);
      
      router.replace(`/order-confirmed/${result.orderId}`);
    } else {
      setIsProcessing(false);
      alert('Failed to place order. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-cream pb-24 relative">
        <div className="sticky top-0 z-30 bg-white border-b border-sand shadow-sm">
          <div className="flex items-center p-4">
            <button onClick={() => !isProcessing && router.back()} className="p-2 -ml-2 mr-2" disabled={isProcessing}>
              <ArrowLeft className="w-6 h-6 text-dark" />
            </button>
            <h1 className="text-[22px] font-bold text-dark">Checkout</h1>
          </div>
          <div className="flex items-center justify-center pb-4 px-4">
            <div className="flex items-center w-full max-w-[200px] justify-between">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary mb-1 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <span className="text-[10px] font-bold text-primary">Address</span>
              </div>
              <div className="flex-1 h-[2px] bg-primary mx-2 -mt-4"></div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary mb-1"></div>
                <span className="text-[10px] font-bold text-primary">Payment</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1">
          <h2 className="text-lg font-bold text-dark mb-4">Choose Payment Method</h2>
          
          <div className="space-y-4 mb-8">
            {methods.map((method) => {
              const Icon = method.icon;
              return (
                <div 
                  key={method.id}
                  onClick={() => !isProcessing && setSelectedMethod(method.id)}
                  className={cn(
                    "p-4 rounded-[16px] border transition-all cursor-pointer",
                    selectedMethod === method.id 
                      ? "border-primary bg-mint/10 shadow-sm" 
                      : "border-sand bg-white"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        selectedMethod === method.id ? "border-primary" : "border-sand"
                      )}>
                        {selectedMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="font-bold text-dark text-sm">{method.name}</span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">{method.desc}</p>
                      
                      {/* Expansion content */}
                      {selectedMethod === method.id && method.id === 'upi' && (
                        <div className="mt-4 pt-4 border-t border-sand/50">
                          <input type="text" placeholder="Enter UPI ID (e.g. name@okhdfc)" className="w-full text-sm font-medium border border-sand bg-white rounded-[10px] px-3 py-2 outline-none focus:border-primary" />
                        </div>
                      )}
                      {selectedMethod === method.id && method.id === 'cod' && (
                        <div className="mt-4 pt-4 border-t border-sand/50">
                          <div className="bg-[#ba7749]/10 p-3 rounded-[10px] border border-[#ba7749]/20 flex gap-2">
                            <span className="text-[#ba7749] text-base">⚠️</span>
                            <span className="text-xs text-[#ba7749] font-medium leading-tight">Cash on delivery — please keep exact change ready.</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-muted">
                      <Icon className={cn("w-6 h-6", selectedMethod === method.id && "text-primary")} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted mb-8">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="font-medium">100% Secured by Razorpay</span>
          </div>

        </div>

        <div className="fixed bottom-0 left-0 right-0 md:left-[260px] p-4 bg-white border-t border-sand z-40 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
          <div className="max-w-[800px] mx-auto">
            <Button 
              size="full" 
              className="w-full shadow-active text-lg" 
              onClick={handlePay}
              disabled={isProcessing}
            >
              Pay {t('currency')}{total}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[20px] p-8 w-full max-w-[280px] flex flex-col items-center justify-center shadow-xl"
            >
              <div className="w-16 h-16 rounded-full border-4 border-sand border-t-primary animate-spin mb-6" />
              <h3 className="font-bold text-dark text-lg mb-2">Processing Payment...</h3>
              <p className="text-sm text-muted text-center">Please do not close the app or press back.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
