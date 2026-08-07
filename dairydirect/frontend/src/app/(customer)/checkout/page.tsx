"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Tag, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { getUserAddresses } from '@/lib/api/addresses';
import { getProducts } from '@/lib/api/products';
import { placeOrder, validateCoupon } from '@/lib/api/orders';
import { clearCart as clearCartApi } from '@/lib/api/cart';
import { Analytics } from '@/lib/analytics';
import type { UserAddress } from '@/lib/api/addresses';
import type { ProductWithVariants } from '@/lib/api/products';
import { motion, AnimatePresence } from 'framer-motion';

import { AddressSelection } from '@/components/checkout/AddressSelection';
import { OrderReview } from '@/components/checkout/OrderReview';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { PaymentSelection } from '@/components/checkout/PaymentSelection';
import { CheckoutConfidence } from '@/components/trust/CheckoutConfidence';
import { initiateRazorpayPayment } from '@/lib/razorpay-client';

export default function CheckoutScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const user = useStore(state => state.user);
  const cart = useStore(state => state.cart);
  const clearCartLocal = useStore(state => state.clearCartLocal);

  const checkoutAddressId = useStore(state => state.checkoutAddressId);
  const setCheckoutAddressId = useStore(state => state.setCheckoutAddressId);
  const selectedMethod = useStore(state => state.checkoutPaymentMethod) || 'razorpay';
  const setSelectedMethod = useStore(state => state.setCheckoutPaymentMethod);

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState('morning1');
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

  const slots = [
    { id: 'morning1', time: '6:00 AM - 8:00 AM', avail: 'Fastest' },
    { id: 'morning2', time: '8:00 AM - 10:00 AM', avail: 'Available' },
    { id: 'evening', time: '5:00 PM - 7:00 PM', avail: 'Available' },
  ];

  // Fetch Data
  useEffect(() => {
    if (user) {
      Promise.all([
        getUserAddresses(user.id),
        getProducts({ activeOnly: true })
      ]).then(([addrs, prods]) => {
        setAddresses(addrs);
        if (addrs.length > 0 && !checkoutAddressId) {
          setCheckoutAddressId(addrs[0].id);
        }
        setProducts(prods);
      });
    }
  }, [user, checkoutAddressId, setCheckoutAddressId]);

  const cartItemsData = useMemo(() => {
    return cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      const variant = product?.product_variants?.find(v => v.id === item.variantId);
      return product && variant ? { ...item, product, variant } : null;
    }).filter(Boolean) as any[]; // Type assertion for brevity since we filtered out nulls
  }, [cart, products]);

  // Pricing Calculation
  useEffect(() => {
    if (cartItemsData.length > 0) {
      const items = cart.map(i => ({ variantId: i.variantId, quantity: i.quantity }));
      
      // Track Checkout Started
      Analytics.trackEvent('Checkout Started', {
        cartSize: cart.length,
        subtotal: pricing?.subtotal || 0
      });

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
  }, [cartItemsData, couponCode, cart, products]);

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

  const handlePlaceOrder = async () => {
    if (!user || cartItemsData.length === 0) return;
    if (!checkoutAddressId) {
      alert('Please add a delivery address.');
      return;
    }

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

    const orderItems = cartItemsData.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      variantWeight: item.variant.weight,
      quantity: item.quantity,
      price: item.variant.price,
    }));

    // ─── Razorpay Online Payment Flow ───
    if (selectedMethod === 'razorpay') {
      const amountInPaise = Math.round((pricing?.total || 0) * 100);

      await initiateRazorpayPayment({
        amount: amountInPaise,
        currency: 'INR',
        name: 'Gjanand Sarkar',
        description: `Order with ${orderItems.length} item(s)`,
        prefill: {
          name: user.name || 'Customer',
          email: user.email || '',
          contact: user.phone || '',
        },
        notes: {
          userId: user.id,
          addressId: checkoutAddressId,
        },
        onSuccess: async (razorpayResponse, verificationData) => {
          setIsProcessing(true);
          const result = await placeOrder({
            userId: user.id,
            customerName: user.name || 'Customer',
            customerPhone: user.phone || '',
            items: orderItems,
            total: pricing?.total || 0,
            addressId: checkoutAddressId,
            paymentMethod: 'razorpay',
            paymentStatus: 'paid',
            couponCode: couponCode || undefined,
          });

          if (result.success && result.orderId) {
            Analytics.trackEvent('Checkout Completed', {
              orderId: result.orderId,
              total: pricing?.total || 0,
              cartSize: cartItemsData.length,
              paymentMethod: 'razorpay',
              razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            });
            clearCartLocal();
            await clearCartApi(user.id);
            router.replace(`/order-confirmed/${result.orderId}`);
          } else {
            setIsProcessing(false);
            alert(result.error || 'Payment verified but order creation failed. Please contact support.');
          }
        },
        onError: (error) => {
          setIsProcessing(false);
          alert(error.message || 'Payment failed or was cancelled.');
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });
      return;
    }

    setIsProcessing(true);

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
      Analytics.trackEvent('Checkout Completed', {
        orderId: result.orderId,
        total: pricing?.total || 0,
        cartSize: cartItemsData.length
      });
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
        <p className="mt-4 text-xs text-muted font-medium">Securing Checkout...</p>
      </div>
    );
  }

  // Calculate free delivery progress for OrderSummary
  // (We use a mock threshold of 300 for UI purposes, matching earlier logic if needed, 
  // but it relies on pricing.nextTier)
  const deliveryProgress = pricing.nextTier > 0
    ? Math.min(100, (pricing.subtotal / (pricing.subtotal + pricing.nextTier)) * 100)
    : 100;
  const isFreeDelivery = pricing.delivery === 0;

  return (
    <>
      <div className="flex flex-col min-h-screen bg-cream pb-[140px] relative">
        <div className="sticky top-0 z-30 bg-white border-b border-sand shadow-sm">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center">
              <button onClick={() => !isProcessing && router.back()} className="p-2 -ml-2 mr-2 rounded-full hover:bg-sand/30" disabled={isProcessing}>
                <ArrowLeft className="w-6 h-6 text-dark" />
              </button>
              <h1 className="text-xl font-black text-dark">Secure Checkout</h1>
            </div>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">100% Safe</span>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 space-y-6">
          <AddressSelection
            addresses={addresses}
            selectedAddressId={checkoutAddressId}
            onSelectAddress={setCheckoutAddressId}
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
          />

          <OrderReview items={cartItemsData} />

          {/* Coupon Section */}
          <div className="bg-white rounded-[20px] p-4 border border-sand shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-dark uppercase tracking-wider">Offers</h3>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter Coupon Code"
                  className={cn(
                    "w-full text-sm font-bold border rounded-[12px] px-3 py-2.5 outline-none transition-all uppercase placeholder:text-muted/50 placeholder:font-medium",
                    couponError ? "border-red-400 bg-red-50 text-red-600" : "border-sand focus:border-primary"
                  )}
                />
                {couponError && <p className="absolute -bottom-5 left-0 text-[10px] text-red-500 font-bold">{couponError}</p>}
              </div>
              <button
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponCode}
                className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-[12px] text-sm shadow-sm transition-all flex items-center justify-center gap-2 min-w-[80px]"
              >
                {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </button>
            </div>
          </div>

          {/* Order Summary component handles the total breakdown */}
          <OrderSummary
            subtotal={pricing.subtotal}
            delivery={pricing.delivery}
            total={pricing.total}
            isFreeDelivery={isFreeDelivery}
            deliveryProgress={deliveryProgress}
            neededForFree={pricing.nextTier}
          />

          {/* Add a manual discount line if OrderSummary doesn't show it natively, or it handles it. 
              Looking at OrderSummary, it doesn't natively show 'discount' so we'll inject it. */}
          {pricing.discount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-[12px] p-3 flex justify-between items-center -mt-4">
              <span className="text-sm font-bold text-green-700">Coupon Discount</span>
              <span className="text-sm font-bold text-green-700">-₹{pricing.discount}</span>
            </div>
          )}

          <PaymentSelection 
            selectedMethod={selectedMethod} 
            onSelectMethod={setSelectedMethod} 
            upiId={upiId} 
            onChangeUpiId={setUpiId} 
          />

          <CheckoutConfidence />
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:left-[260px] p-4 bg-white border-t border-sand z-40 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-[800px] mx-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-muted uppercase">Total Pay</span>
              <span className="text-xl font-black text-dark">₹{pricing.total}</span>
            </div>
            <Button
              size="lg"
              className="flex-1 shadow-active text-base"
              onClick={handlePlaceOrder}
              disabled={isProcessing || !checkoutAddressId || cartItemsData.length === 0}
            >
              {selectedMethod === 'razorpay' 
                ? `Pay ₹${pricing.total} with Razorpay` 
                : selectedMethod === 'cod' 
                  ? 'Place Order (Cash on Delivery)' 
                  : 'Place Order'}
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
              <h3 className="font-bold text-dark text-lg mb-2">Placing Order...</h3>
              <p className="text-sm text-muted text-center">Please do not close the app or press back.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
