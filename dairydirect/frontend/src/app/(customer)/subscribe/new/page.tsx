"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Calendar, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { getUserSubscriptions, createSubscription, submitModificationReport } from '@/lib/api/subscriptions';
import { getProducts } from '@/lib/api/products';
import { format, addDays } from 'date-fns';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

function NewSubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useStore(state => state.user);
  
  const editId = searchParams.get('edit');

  const [volume, setVolume] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState<'daily' | 'alternate' | 'weekly'>('daily');
  const [isSuccess, setIsSuccess] = useState(false);
  const [subscriptionProductId, setSubscriptionProductId] = useState<string>('');
  const [subscriptionVariantId, setSubscriptionVariantId] = useState<string>('');
  const [subscriptionProductName, setSubscriptionProductName] = useState('');
  const [subscriptionProductImage, setSubscriptionProductImage] = useState(PLACEHOLDER_PRODUCT_IMAGE);
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [deliveryTime, setDeliveryTime] = useState('07:00');

  useEffect(() => {
    async function loadData() {
      const products = await getProducts({ activeOnly: true });
      const defaultProduct = products[0];
      if (defaultProduct) {
        setSubscriptionProductId(defaultProduct.id);
        setSubscriptionProductName(defaultProduct.name);
        if (defaultProduct.image_url) setSubscriptionProductImage(defaultProduct.image_url);
        if (defaultProduct.product_variants && defaultProduct.product_variants.length > 0) {
          setSubscriptionVariantId(defaultProduct.product_variants[0].id);
        }
      }

      if (user && editId) {
        const subs = await getUserSubscriptions(user.id);
        const existingSub = subs.find(s => s.id === editId);
        if (existingSub) {
          setVolume(existingSub.volume);
          setPlan((existingSub.plan as any) || 'daily');
        }
      }
    }
    loadData();
  }, [user, editId]);

  const PRICE_PER_LITER = 68;
  const dailyCost = volume * PRICE_PER_LITER;
  const total = plan === 'weekly' ? dailyCost * 7 : plan === 'alternate' ? dailyCost * 15 : dailyCost * 30 * 0.95;

  const handleAction = async () => {
    if (!user) return;
    setIsProcessing(true);
    
    try {
      let result;
      if (editId) {
        result = await submitModificationReport({
          subscriptionId: editId,
          userId: user.id,
          newVolume: volume,
          newPlan: plan as any,
        });
      } else {
        const combinedDateTime = new Date(`${startDate}T${deliveryTime}:00`).toISOString();
        result = await createSubscription({
          userId: user.id,
          productId: subscriptionProductId,
          variantId: subscriptionVariantId,
          volume,
          plan,
          startDate: combinedDateTime,
        });
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Action failed. Please try again.');
      }
      
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.replace('/subscribe');
      }, 2000);
    } catch (error: any) {
      setIsProcessing(false);
      alert(error.message || 'Action failed. Please try again.');
    }
  };

  const volumePresets = [
    { label: '500ml', value: 0.5 },
    { label: '1L', value: 1 },
    { label: '2L', value: 2 },
    { label: '2.5L', value: 2.5 },
  ];

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
        <div className="w-24 h-24 bg-mint/30 rounded-full flex items-center justify-center mb-6 text-primary shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-dark mb-2 tracking-tight">
          {editId ? 'Request Submitted!' : 'Subscription Started!'}
        </h2>
        <p className="text-muted text-sm max-w-[280px] leading-relaxed">
          {editId 
            ? 'Your modification report has been sent to the farm. You’ll be notified once it’s accepted.' 
            : 'Welcome to the Gjanand Sarkar family. Your first delivery arrives tomorrow morning.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-container pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface-container/80 backdrop-blur-md border-b border-sand/30">
        <div className="flex items-center p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 mr-2 text-dark hover:text-primary hover:bg-sand/30 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-extrabold text-dark tracking-tight">
            {editId ? 'Modify Subscription' : 'New Subscription'}
          </h1>
        </div>
      </div>

      <div className="p-4 flex-1 max-w-[800px] mx-auto w-full">
        {/* Product Hero */}
        <div className="bg-white rounded-[24px] shadow-sm p-6 mb-6 flex flex-col items-center border border-sand/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full -ml-16 -mb-16 blur-2xl" />
          
          <div className="w-24 h-24 relative mb-4 overflow-hidden rounded-[20px] bg-sky-50 flex items-center justify-center p-2 shadow-inner border border-sand/30">
            <img src={subscriptionProductImage} alt={subscriptionProductName} className="w-full h-full object-contain" />
          </div>
          <h2 className="font-black text-dark text-xl mb-1 text-center">{subscriptionProductName}</h2>
          <p className="text-[11px] text-primary font-bold uppercase tracking-widest mb-6 bg-primary/10 px-3 py-1 rounded-full">A2 Quality • Pure Harvest</p>
          
          <div className="w-full space-y-6">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Daily Requirement</label>
              <div className="grid grid-cols-4 gap-2">
                {volumePresets.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => setVolume(preset.value)}
                    className={cn(
                      "py-3 rounded-[16px] text-sm font-black transition-all border-2",
                      volume === preset.value 
                        ? "bg-primary border-primary text-white shadow-active" 
                        : "bg-surface-container border-transparent text-muted hover:border-sand"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-container/50 rounded-[16px] border border-sand/30">
              <div className="flex flex-col">
                <span className="font-black text-dark text-sm uppercase tracking-widest">Custom Qty</span>
                <span className="text-[10px] text-muted font-bold uppercase tracking-wide">Enter in Liters</span>
              </div>
              <div className="relative">
                <input 
                  type="number"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  className="w-24 h-12 text-right pr-10 font-black text-xl bg-white border-2 border-sand rounded-[14px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-muted text-sm pointer-events-none">L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <h3 className="font-bold text-dark mb-3 text-lg px-1">Delivery Plan</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div 
            onClick={() => setPlan('daily')}
            className={cn(
              "p-4 rounded-[20px] border-2 cursor-pointer transition-all relative overflow-hidden bg-white text-center",
              plan === 'daily' ? "border-primary shadow-[0_0_0_4px_rgba(63,101,48,0.1)]" : "border-sand/50 text-dark hover:border-sand"
            )}
          >
            <div className="absolute top-0 right-0 bg-mint text-primary text-[9px] font-black px-2 py-0.5 rounded-bl-[10px]">SAVE 5%</div>
            <div className="font-black text-sm mb-1 mt-1">Daily</div>
            <div className="text-[11px] text-muted font-medium mb-3">Everyday</div>
            <div className="font-black text-base text-dark">₹{Math.round(dailyCost * 30 * 0.95)}<span className="text-[10px] text-muted font-normal">/mo</span></div>
          </div>

          <div 
            onClick={() => setPlan('alternate')}
            className={cn(
              "p-4 rounded-[20px] border-2 cursor-pointer transition-all bg-white text-center",
              plan === 'alternate' ? "border-primary shadow-[0_0_0_4px_rgba(63,101,48,0.1)]" : "border-sand/50 text-dark hover:border-sand"
            )}
          >
            <div className="font-black text-sm mb-1">Alternate</div>
            <div className="text-[11px] text-muted font-medium mb-3">Every 2 Days</div>
            <div className="font-black text-base text-dark">₹{Math.round(dailyCost * 15)}<span className="text-[10px] text-muted font-normal">/mo</span></div>
          </div>

          <div 
            onClick={() => setPlan('weekly')}
            className={cn(
              "p-4 rounded-[20px] border-2 cursor-pointer transition-all bg-white text-center",
              plan === 'weekly' ? "border-primary shadow-[0_0_0_4px_rgba(63,101,48,0.1)]" : "border-sand/50 text-dark hover:border-sand"
            )}
          >
            <div className="font-black text-sm mb-1">Weekly</div>
            <div className="text-[11px] text-muted font-medium mb-3">7 Days</div>
            <div className="font-black text-base text-dark">₹{Math.round(dailyCost * 7)}<span className="text-[10px] text-muted font-normal">/wk</span></div>
          </div>
        </div>

        {/* Start Date & Time */}
        <div className="bg-white rounded-[16px] p-4 border border-sand/50 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-4 border-b border-sand/30 pb-4">
            <div className="w-10 h-10 rounded-full bg-mint/30 flex items-center justify-center text-primary shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">First Delivery</p>
              <input 
                type="date"
                min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm font-bold text-dark bg-transparent outline-none cursor-pointer"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-mint/30 flex items-center justify-center text-primary shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Delivery Time</p>
              <select 
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full text-sm font-bold text-dark bg-transparent outline-none cursor-pointer"
              >
                <option value="07:00">Morning (7:00 AM - 9:00 AM)</option>
                <option value="17:00">Evening (5:00 PM - 7:00 PM)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-sand/50 z-40 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-[800px] mx-auto w-full flex flex-col md:flex-row items-center gap-4">
          <div className="hidden md:flex flex-col flex-1">
            <p className="text-xs text-muted font-medium mb-1">
              {editId ? 'Modification Report' : 'Advance Payment Required'}
            </p>
            <p className="text-sm font-bold text-dark">
              Total: ₹{Math.round(total)}
            </p>
          </div>
          <Button 
            size="full" 
            onClick={handleAction} 
            disabled={isProcessing}
            className="shadow-active text-lg md:w-auto md:min-w-[300px] h-14"
          >
            {isProcessing ? 'Processing...' : editId ? 'Submit Modification Report' : `Pay ₹${Math.round(total)} to Subscribe`}
          </Button>
          <p className="text-[11px] text-muted font-medium text-center md:hidden mt-2">
            {editId ? 'Changes apply after farm approval' : 'Advance payment required to start subscription'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NewSubscriptionScreen() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-surface-container"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"/></div>}>
      <NewSubscriptionContent />
    </Suspense>
  );
}
