import { ShieldCheck, ArrowLeftRight, Clock } from 'lucide-react';

export function CheckoutConfidence() {
  return (
<<<<<<< HEAD
    <div className="bg-surface-container-lowest border border-sand rounded-[20px] p-4 mt-2">
      <h3 className="text-[12px] font-semibold text-dark uppercase tracking-widest mb-3">Why choose GjanandSarkar?</h3>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-success-bg text-success flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-dark">100% Secure Payments</h4>
            <p className="text-xs text-muted">All transactions are encrypted and secure.</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-info-bg text-info flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-dark">On-Time Delivery</h4>
            <p className="text-xs text-muted">We ensure your order reaches you when promised.</p>
=======
    <div className="bg-surface border border-border rounded-xl p-4">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Our Guarantees</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Secure Payments</h4>
            <p className="text-[11px] text-muted">256-bit encrypted checkout</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border text-primary flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Morning Delivery</h4>
            <p className="text-[11px] text-muted">Cold-chain delivered by 6:30 AM</p>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border text-primary flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </div>
          <div>
<<<<<<< HEAD
            <h4 className="text-sm font-bold text-dark">Easy Cancellations</h4>
            <p className="text-xs text-muted">Cancel easily if you change your mind.</p>
=======
            <h4 className="text-xs font-bold text-foreground">Instant Refund</h4>
            <p className="text-[11px] text-muted">Hassle-free quality replacement</p>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </div>
        </div>
      </div>
    </div>
  );
}
