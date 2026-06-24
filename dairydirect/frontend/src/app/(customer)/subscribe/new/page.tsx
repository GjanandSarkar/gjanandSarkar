"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Minus, Plus, Calendar, MapPin, Droplets, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { createSubscription, submitModificationReport, getUserSubscriptions } from '@/lib/api/subscriptions';
import { getProducts } from '@/lib/api/products';
import Link from 'next/link';

function NewSubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const user = useStore(state => state.user);
  
  const editId = searchParams.get('edit');

  const [volume, setVolume] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState<'weekly' | 'monthly'>('monthly');
  const [isSuccess, setIsSuccess] = useState(false);
  const [milkProductId, setMilkProductId] = useState<string>('');

  useEffect(() => {
    // Determine the product ID for milk and fetch existing sub if editing
    async function loadData() {
      const products = await getProducts({ activeOnly: true });
      const milkObj = products.find(p => p.category === 'Milk') || products[0];
      if (milkObj) setMilkProductId(milkObj.id);

      if (user && editId) {
        const subs = await getUserSubscriptions(user.id);
        const existingSub = subs.find(s => s.id === editId);
        if (existingSub) {
          setVolume(existingSub.volume);
          setPlan(existingSub.plan as 'weekly' | 'monthly');
        }
      }
    }
    loadData();
  }, [user, editId]);

  const PRICE_PER_LITER = 68;
  const dailyCost = volume * PRICE_PER_LITER;
  const total = plan === 'weekly' ? dailyCost * 7 : dailyCost * 30 * 0.95;

  const handleAction = async () => {
    if (!user) return;
    setIsProcessing(true);
    
    let result;
    if (editId) {
      result = await submitModificationReport({
        subscriptionId: editId,
        userId: user.id,
        newVolume: volume,
        newPlan: plan
      });
    } else {
      if (!milkProductId) {
        alert('Product not available');
        setIsProcessing(false);
        return;
      }
      result = await createSubscription({
        userId: user.id,
        productId: milkProductId,
        volume,
        plan
      });
    }

    if (result.success) {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.replace('/subscribe');
      }, 2000);
    } else {
      setIsProcessing(false);
      alert('Action failed. Please try again.');
    }
  };

  const volumePresets = [
    { label: '500ml', value: 0.5 },
    { label: '1 L', value: 1 },
    { label: '2 L', value: 2 },
    { label: '2.5 L', value: 2.5 },
  ];

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
        <div className="w-20 h-20 bg-mint/30 rounded-full flex items-center justify-center mb-6 text-primary">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-dark mb-2">
          {editId ? 'Request Submitted!' : 'Subscription Started!'}
        </h2>
        <p className="text-muted text-sm max-w-[280px]">
          {editId 
            ? 'Your modification report has been sent to the farm. You’ll be notified once it’s accepted.' 
            : 'Welcome to the Gjanand Sarkar family. Your first delivery arrives tomorrow!'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-cream pb-24">
      <div className="sticky top-0 z-30 bg-white border-b border-sand shadow-sm">
        <div className="flex items-center p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 mr-2 text-dark hover:text-primary transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[22px] font-bold text-dark">
            {editId ? 'Manage Subscription' : 'Subscribe to Milk'}
          </h1>
        </div>
      </div>

      <div className="p-4 flex-1">
        <div className="bg-white rounded-[24px] shadow-sm p-6 mb-6 flex flex-col items-center border border-sand relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="w-20 h-20 relative mb-4 overflow-hidden rounded-[20px] bg-sky-50 flex items-center justify-center shadow-inner">
            <img src="/milk.png" alt="Farm Fresh Cow Milk" className="w-full h-full object-cover" />
          </div>
          <h2 className="font-black text-dark text-xl mb-1">Farm Fresh Cow Milk</h2>
          <p className="text-[11px] text-muted font-bold uppercase tracking-widest mb-6">A2 Quality • Pure Harvest</p>
          
          <div className="w-full space-y-5">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-1">Requirement per day</label>
              <div className="grid grid-cols-4 gap-2">
                {volumePresets.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => setVolume(preset.value)}
                    className={cn(
                      "py-3 rounded-[14px] text-[12px] font-black transition-all border-2",
                      volume === preset.value 
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                        : "bg-surface-container border-transparent text-muted hover:border-sand"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-container/50 rounded-2xl border border-sand/30">
              <div className="flex flex-col">
                <span className="font-black text-on-surface text-[14px] uppercase tracking-widest">Custom Qty</span>
                <span className="text-[10px] text-muted font-bold uppercase tracking-wide">Enter in Liters</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input 
                    type="number"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-24 h-12 text-right pr-10 font-black text-xl bg-white border border-sand rounded-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-muted text-sm pointer-events-none">L</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center px-2">
               <div className="flex flex-col">
                  <span className="text-[10px] text-muted font-black uppercase tracking-widest">Rate</span>
                  <span className="font-bold text-dark">{t('currency')}{PRICE_PER_LITER}/L</span>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] text-muted font-black uppercase tracking-widest">Daily Cost</span>
                  <span className="font-black text-primary text-lg">{t('currency')}{dailyCost.toFixed(1)}</span>
               </div>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-dark mb-3">Choose Plan</h3>
        <div className="flex gap-3 mb-6">
          <div 
            onClick={() => setPlan('weekly')}
            className={cn(
              "flex-1 p-4 rounded-[12px] border cursor-pointer transition-all",
              plan === 'weekly' ? "border-primary bg-primary text-white shadow-active" : "border-sand bg-white text-dark"
            )}
          >
            <div className="font-bold text-sm mb-1 text-center">Weekly</div>
            <div className="text-xs text-center opacity-80 mb-2">7 Days</div>
            <div className="font-bold text-lg text-center mt-auto">{t('currency')}{Math.round(dailyCost * 7)}</div>
          </div>
          <div 
            onClick={() => setPlan('monthly')}
            className={cn(
              "flex-1 p-4 rounded-[12px] border cursor-pointer transition-all relative overflow-hidden",
              plan === 'monthly' ? "border-primary bg-primary text-white shadow-active" : "border-sand bg-white text-dark"
            )}
          >
            <div className="absolute top-0 right-0 bg-mint text-primary text-[9px] font-black px-2 py-0.5 rounded-bl-[8px]">SAVE 5%</div>
            <div className="font-bold text-sm mb-1 text-center mt-1">Monthly</div>
            <div className="text-xs text-center opacity-80 mb-2">30 Days</div>
            <div className="font-bold text-lg text-center mt-auto">{t('currency')}{Math.round(total)}</div>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-between p-4 bg-white rounded-[12px] border border-sand">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-muted mr-3" />
              <div>
                <div className="text-xs text-muted font-medium mb-0.5">Starts From</div>
                <div className="text-sm font-bold text-dark">Tomorrow</div>
              </div>
            </div>
            <button className="text-xs font-bold text-primary">Change</button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-[12px] border border-sand">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-muted mr-3" />
              <div>
                <div className="text-xs text-muted font-medium mb-0.5">Deliver To</div>
                <div className="text-sm font-bold text-dark">Home</div>
              </div>
            </div>
            <button className="text-xs font-bold text-primary">Change</button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:left-[260px] p-4 flex flex-col bg-white border-t border-sand z-40 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-[800px] mx-auto w-full flex flex-col">
          <p className="text-xs text-clay font-medium text-center mb-3">
            {editId ? 'Changes will be effective after farm approval.' : 'Advance payment required to start subscription.'}
          </p>
          <Button 
            size="full" 
            onClick={handleAction} 
            disabled={isProcessing}
            className="shadow-active text-lg"
          >
            {isProcessing ? 'Processing...' : editId ? 'Submit Modification Report' : `Subscribe & Pay ${t('currency')}${Math.round(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewSubscriptionScreen() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <NewSubscriptionContent />
    </Suspense>
  );
}
