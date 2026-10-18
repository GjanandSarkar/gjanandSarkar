"use client";

import { cn } from '@/lib/utils';
import { CreditCard, Wallet, Banknote } from 'lucide-react';
import React from 'react';

interface PaymentSelectionProps {
  selectedMethod: string;
  onSelectMethod: (id: string) => void;
  upiId: string;
  onChangeUpiId: (id: string) => void;
}

export function PaymentSelection({
  selectedMethod,
  onSelectMethod,
  upiId,
  onChangeUpiId
}: PaymentSelectionProps) {
  const methods = [
    { 
      id: 'razorpay', 
      name: 'Razorpay Online Checkout', 
      desc: 'UPI, Credit/Debit Cards, Netbanking, Wallets', 
      icon: CreditCard,
      badge: 'Fast & Secure'
    },
    { 
      id: 'upi', 
      name: 'Direct UPI ID', 
      desc: 'Google Pay, PhonePe, Paytm (VPA ID)', 
      icon: Wallet 
    },
    { 
      id: 'cod', 
      name: 'Cash on Delivery', 
      desc: 'Pay at your doorstep upon morning delivery', 
      icon: Banknote 
    },
  ];

  return (
    <div className="bg-surface rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/60">
        <Wallet className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Payment Method</h3>
      </div>
      
      <div className="space-y-2.5">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <div 
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={cn(
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
          );
        })}
      </div>
    </div>
  );
}
