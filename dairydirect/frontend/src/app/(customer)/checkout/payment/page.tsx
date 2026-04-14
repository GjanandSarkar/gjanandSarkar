"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Wallet, Banknote, ShieldCheck, Loader2, Tag, Percent, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { getProducts } from '@/lib/api/products';
import { placeOrder, validateCoupon } from '@/lib/api/orders';
import { clearCart as clearCartApi } from '@/lib/api/cart';
import type { ProductWithVariants } from '@/lib/api/products';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const user = useStore(state => state.user);
  const cart = useStore(state => state.cart);
  const clearCartLocal = useStore(state => state.clearCartLocal);
  const checkoutAddressId = useStore(state => state.checkoutAddressId);
  const selectedMethod = useStore(state => state.checkoutPaymentMethod) || 'upi';
  const setSelectedMethod = useStore(state => state.setCheckoutPaymentMethod);
  
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // New States
  const [upiId, setUpiId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [pricing, setPricing] = useState<{
    subtotal: number,
    delivery: number,
    discount: number,
    total: number,
    nextTier: number
  } | null>(null);

  useEffect(() => {
    getProducts({ activeOnly: true }).then(data => {
      setProducts(data);
    });
    // Set default UPI if available
    if (user?.id) {
       // Mock fetch profile/saved upi id? For now let's hope user object has it or we can fetch it.
       // (In real app, fetch from DB)
    }
  }, [user]);

  const cartItemsData = useMemo(() => {
    return cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      const variant = product?.product_variants?.find(v => v.id === item.variantId);
      return product && variant ? { ...item, product, variant } : null;
    }).filter(Boolean);
  }, [cart, products]);

  // Pricing Calculation Trigger
  useEffect(() => {
    if (cartItemsData.length > 0) {
      const items = cart.map(i => ({ variantId: i.variantId, quantity: i.quantity }));
      validateCoupon(items, couponCode).then(res => {
        setPricing({
          subtotal: res.subtotal || 0,
          delivery: res.deliveryFee || 0,
          discount: res.discount || 0,
          total: res.total || 0,
          nextTier: (res as any).nextTierAmount || 0
        });
        setIsLoading(false);
      });
    } else if (products.length > 0) {
      setIsLoading(false);
    }
  }, [cartItemsData, couponCode]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    
    const items = cart.map(i => ({ variantId: i.variantId, quantity: i.quantity }));
    const res = await validateCoupon(items, couponCode);
    
    if (res.valid) {
      setPricing({
        subtotal: res.subtotal,
        delivery: res.deliveryFee,
        discount: res.discount,
        total: res.total,
        nextTier: (res as any).nextTierAmount || 0
      });
    } else {
      setCouponError(res.message || 'Invalid coupon');
      setCouponCode('');
    }
    setIsApplyingCoupon(false);
  };

  const methods = [
    { id: 'upi', name: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: Wallet },
    { id: 'card', name: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard },
    { id: 'cod', name: 'Cash on Delivery', desc: 'Pay at your doorstep', icon: Banknote },
  ];

  const handlePay = async () => {
    if (!user || cartItemsData.length === 0 || !checkoutAddressId) return;

    // UPI Validation
    if (selectedMethod === 'upi') {
      if (!upiId) {
        alert('Please enter your UPI ID');
        return;
      }
      if (!upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g. name@okhdfc)');
        return;
      }
    }

    setIsProcessing(true);
    
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
      total: pricing?.total || 0,
      addressId: checkoutAddressId,
      paymentMethod: selectedMethod,
      paymentStatus: selectedMethod === 'cod' ? 'pending' : 'paid',
      couponCode: couponCode || undefined,
      upiId: selectedMethod === 'upi' ? upiId : undefined
    });

    if (result.success && result.orderId) {
      clearCartLocal();
      await clearCartApi(user.id);
      router.replace(`/order-confirmed/${result.orderId}`);
    } else {
      setIsProcessing(false);
      alert(result.error || 'Failed to place order. Please try again.');
    }
  };

  if (isLoading || !pricing) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-xs text-muted font-medium">Calculating Profit-Safe Pricing...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-cream pb-32 relative">
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
          {/* Coupon Section */}
          <div className="bg-white rounded-[20px] p-4 border border-sand shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-dark uppercase tracking-wider">Apply Coupon</h3>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="COUPON CODE" 
                  className={cn(
                    "w-full text-sm font-bold border rounded-[12px] px-3 py-2.5 outline-none transition-all uppercase placeholder:text-muted/50",
                    couponError ? "border-red-400 bg-red-50 text-red-600" : "border-sand focus:border-primary"
                  )}
                />
                {couponError && <p className="absolute -bottom-5 left-0 text-[10px] text-red-500 font-bold">{couponError}</p>}
              </div>
              <button 
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponCode}
                className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-[12px] text-sm shadow-sm transition-all flex items-center gap-2"
              >
                {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </button>
            </div>
          </div>

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
                          <label className="text-[10px] uppercase font-bold text-muted mb-1 block">Your UPI ID</label>
                          <input 
                            type="text" 
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="e.g. roshan@okaxis" 
                            className="w-full text-sm font-medium border border-sand bg-white rounded-[10px] px-3 py-2 outline-none focus:border-primary" 
                          />
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

          {/* Pricing Breakdown */}
          <div className="bg-white rounded-[20px] p-4 border border-sand shadow-sm mb-8 space-y-3">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-muted">Item Subtotal</span>
              <span className="text-dark">₹{pricing.subtotal}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-muted">Delivery Fee</span>
              <span className={cn(pricing.delivery === 0 ? "text-green-600" : "text-dark")}>
                {pricing.delivery === 0 ? 'FREE' : `₹${pricing.delivery}`}
              </span>
            </div>
            {pricing.discount > 0 && (
              <div className="flex justify-between items-center text-sm font-medium text-green-600">
                <span className="flex items-center gap-1"><Percent className="w-3 h-3" /> Discount</span>
                <span>-₹{pricing.discount}</span>
              </div>
            )}
            
            {pricing.nextTier > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-[12px] p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-[11px] text-blue-700 font-bold leading-tight">
                  Add ₹{Math.ceil(pricing.nextTier)} more to unlock FREE delivery!
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-sand flex justify-between items-center">
              <span className="text-base font-bold text-dark">Total Pay</span>
              <span className="text-xl font-black text-primary">₹{pricing.total}</span>
            </div>
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
              Pay ₹{pricing.total}
            </Button>
          </div>
        </div>
      </div>

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

