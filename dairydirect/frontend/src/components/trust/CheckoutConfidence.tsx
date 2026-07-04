import { ShieldCheck, ArrowLeftRight, Clock } from 'lucide-react';

export function CheckoutConfidence() {
  return (
    <div className="bg-surface-container-lowest border border-sand rounded-[20px] p-4 mt-2">
      <h3 className="text-[12px] font-black text-dark uppercase tracking-widest mb-3">Why choose GjanandSarkar?</h3>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-dark">100% Secure Payments</h4>
            <p className="text-[11px] text-muted">All transactions are encrypted and secure.</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-dark">On-Time Delivery</h4>
            <p className="text-[11px] text-muted">We ensure your order reaches you when promised.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-dark">Easy Cancellations</h4>
            <p className="text-[11px] text-muted">Cancel easily if you change your mind.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
