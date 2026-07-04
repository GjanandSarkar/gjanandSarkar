import { PauseCircle, Bell, Truck } from 'lucide-react';

export function SubscriptionConfidence() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-primary/5 border border-primary/20 rounded-[20px] p-5 my-6">
      <h3 className="text-[14px] font-black text-dark mb-4 tracking-tight">Subscribe with Confidence</h3>
      
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-sm border border-sand">
            <PauseCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-dark">Pause Anytime</h4>
            <p className="text-[12px] text-muted leading-tight">Going on vacation? Pause or modify your subscription instantly.</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-sm border border-sand">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-dark">Assured Morning Delivery</h4>
            <p className="text-[12px] text-muted leading-tight">Wake up to fresh GjanandSarkar dairy at your doorstep.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-sm border border-sand">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-dark">No Hidden Fees</h4>
            <p className="text-[12px] text-muted leading-tight">Pay only for what gets delivered. Transparent wallet billing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
