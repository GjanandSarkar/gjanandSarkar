"use client";

import React, { useState } from 'react';
import { initiateRazorpayPayment, RazorpaySuccessResponse } from '@/lib/razorpay-client';
import { Loader2, ShieldCheck, CreditCard, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RazorpayButtonProps {
  amountInRupees: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderDescription?: string;
  className?: string;
  buttonText?: string;
  disabled?: boolean;
  notes?: Record<string, string>;
  onSuccess: (response: RazorpaySuccessResponse, verificationData: any) => void | Promise<void>;
  onError?: (error: { message: string; details?: any }) => void;
  onCancel?: () => void;
}

export function RazorpayButton({
  amountInRupees,
  customerName,
  customerEmail,
  customerPhone,
  orderDescription = 'Order Payment',
  className,
  buttonText,
  disabled = false,
  notes,
  onSuccess,
  onError,
  onCancel,
}: RazorpayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const amountInPaise = Math.round(amountInRupees * 100);

  const handlePayment = async () => {
    if (disabled || isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);

    await initiateRazorpayPayment({
      amount: amountInPaise,
      currency: 'INR',
      name: 'Gjanand Sarkar',
      description: orderDescription,
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      notes: notes || {},
      onSuccess: async (response, verificationData) => {
        setIsLoading(false);
        await onSuccess(response, verificationData);
      },
      onError: (error) => {
        setIsLoading(false);
        setErrorMessage(error.message);
        onError?.(error);
      },
      onDismiss: () => {
        setIsLoading(false);
        onCancel?.();
      },
    });
  };

  return (
    <div className="w-full space-y-2">
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-error-bg border border-error/20 rounded-lg text-error text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-error" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePayment}
        disabled={disabled || isLoading || amountInRupees <= 0}
        className={cn(
          "w-full min-h-[44px] relative flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-lg font-semibold text-sm text-on-primary",
          "bg-primary hover:bg-primary-hover",
          "shadow-xs transition-colors active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting to Razorpay...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 text-on-primary" />
            <span>{buttonText || `Pay ₹${amountInRupees.toFixed(2)} with Razorpay`}</span>
            <div className="flex items-center gap-1 ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-on-primary" />
              <span>Razorpay</span>
            </div>
          </>
        )}
      </button>
    </div>
  );
}
