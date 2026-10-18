import { ShieldCheck, ArrowLeftRight, Clock } from 'lucide-react';

export function CheckoutConfidence() {
  return (
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
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border text-primary flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Instant Refund</h4>
            <p className="text-[11px] text-muted">Hassle-free quality replacement</p>
          </div>
        </div>
      </div>
    </div>
  );
}
