"use client";

import { cn } from '@/lib/utils';
import { CreditCard, Banknote, ShieldCheck } from 'lucide-react';
import React from 'react';

interface PaymentSelectionProps {
  selectedMethod: string;
  onSelectMethod: (id: string) => void;
}

/**
 * Payment methods that the order API actually accepts.
 *
 * A previous "Direct UPI ID" option let customers type a VPA and then failed
 * server-side with HTTP 400, because direct UPI was removed from the order
 * route. The contract is now explicit: every method rendered here must be a
 * method `PlaceOrderSchema` and `/api/orders/place` support. UPI is offered
 * *inside* Razorpay, which is the only place it can be verified.
 */
const METHODS = [
  {
    id: 'razorpay',
    name: 'UPI, cards & netbanking',
    desc: 'Pay securely with GPay, PhonePe, Paytm, cards or netbanking',
    icon: CreditCard,
    badge: 'Recommended',
  },
  {
    id: 'cod',
    name: 'Cash on delivery',
    desc: 'Pay the rider when your order arrives',
    icon: Banknote,
  },
] as const;

export function PaymentSelection({ selectedMethod, onSelectMethod }: PaymentSelectionProps) {
  return (
<<<<<<< HEAD
    <fieldset className="bg-surface rounded-2xl p-4 border border-border shadow-xs">
      <legend className="sr-only">Payment method</legend>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Payment method</h3>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          Secure
        </span>
      </div>

      <div className="space-y-2.5">
        {METHODS.map((method) => {
=======
    <div className="bg-surface rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
        <Wallet className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Payment Method</h3>
      </div>
      
      <div className="space-y-2.5">
        {methods.map((method) => {
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          const Icon = method.icon;
          const selected = selectedMethod === method.id;
          return (
            <label
              key={method.id}
              className={cn(
<<<<<<< HEAD
                'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors min-h-[64px]',
                selected
                  ? 'border-primary bg-primary-fixed/50'
                  : 'border-border bg-surface hover:border-primary/40'
              )}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.id}
                checked={selected}
                onChange={() => onSelectMethod(method.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                  selected ? 'border-primary' : 'border-border-hover'
                )}
              >
                {selected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </span>

              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground text-sm">{method.name}</span>
                  {'badge' in method && method.badge && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {method.badge}
                    </span>
                  )}
                </span>
                <span className="block text-xs text-foreground-muted mt-0.5 leading-relaxed">
                  {method.desc}
                </span>
              </span>

              <Icon
                className={cn('w-5 h-5 shrink-0', selected ? 'text-primary' : 'text-foreground-muted')}
                aria-hidden="true"
              />
            </label>
=======
                "p-3 rounded-xl border transition-all cursor-pointer",
                selectedMethod === method.id 
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30" 
                  : "border-border bg-surface hover:border-border/80"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                    selectedMethod === method.id ? "border-primary" : "border-border"
                  )}>
                    {selectedMethod === method.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-foreground text-xs leading-tight">{method.name}</span>
                    {method.badge && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-primary/10 text-primary tracking-wider">
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed truncate">{method.desc}</p>
                  
                  {/* Expansion content */}
                  {selectedMethod === method.id && method.id === 'upi' && (
                    <div className="mt-2.5 pt-2.5 border-t border-border" onClick={(e) => e.stopPropagation()}>
                      <label className="text-[10px] uppercase font-bold text-muted mb-1 block">Enter your UPI ID</label>
                      <input 
                        type="text" 
                        value={upiId}
                        onChange={(e) => onChangeUpiId(e.target.value)}
                        placeholder="e.g. mobile@okaxis or name@upi" 
                        className="w-full text-xs font-medium border border-border bg-surface rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors placeholder:text-muted/60 text-foreground" 
                      />
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-muted">
                  <Icon className={cn("w-4 h-4 transition-colors", selectedMethod === method.id && "text-primary")} />
                </div>
              </div>
            </div>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          );
        })}
      </div>

      <p className="text-[11px] text-foreground-muted mt-3 leading-relaxed">
        UPI is available inside the secure payment window. We never ask for your UPI PIN.
      </p>
    </fieldset>
  );
}
