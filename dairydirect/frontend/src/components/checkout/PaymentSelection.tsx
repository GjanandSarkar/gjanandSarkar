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
    { id: 'upi', name: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: Wallet },
    { id: 'card', name: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard },
    { id: 'cod', name: 'Cash on Delivery', desc: 'Pay at your doorstep', icon: Banknote },
  ];

  return (
    <div className="bg-white rounded-[20px] p-4 border border-sand shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-dark uppercase tracking-wider">Payment Method</h3>
      </div>
      
      <div className="space-y-3">
        {methods.map((method) => {
          const Icon = method.icon;
          return (
            <div 
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={cn(
                "p-3 rounded-[16px] border transition-all cursor-pointer",
                selectedMethod === method.id 
                  ? "border-primary bg-mint/10 shadow-sm" 
                  : "border-sand bg-white hover:border-primary/30"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    selectedMethod === method.id ? "border-primary" : "border-sand"
                  )}>
                    {selectedMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-0.5">
                    <span className="font-bold text-dark text-sm leading-tight">{method.name}</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed truncate">{method.desc}</p>
                  
                  {/* Expansion content */}
                  {selectedMethod === method.id && method.id === 'upi' && (
                    <div className="mt-3 pt-3 border-t border-sand/50" onClick={(e) => e.stopPropagation()}>
                      <label className="text-[10px] uppercase font-bold text-primary mb-1.5 block">Enter your UPI ID</label>
                      <input 
                        type="text" 
                        value={upiId}
                        onChange={(e) => onChangeUpiId(e.target.value)}
                        placeholder="e.g. roshan@okaxis" 
                        className="w-full text-sm font-medium border border-sand bg-white rounded-[12px] px-3 py-2.5 outline-none focus:border-primary transition-colors placeholder:text-muted/50" 
                      />
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-muted/50">
                  <Icon className={cn("w-5 h-5 transition-colors", selectedMethod === method.id && "text-primary")} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
