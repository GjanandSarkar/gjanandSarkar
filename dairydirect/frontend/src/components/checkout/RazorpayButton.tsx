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
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePayment}
        disabled={disabled || isLoading || amountInRupees <= 0}
        className={cn(
          "w-full relative flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-bold text-sm text-white",
          "bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-[#143427] hover:to-[#22533e]",
          "shadow-[0_4px_14px_rgba(27,67,50,0.35)] hover:shadow-[0_6px_20px_rgba(27,67,50,0.45)]",
          "transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
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
            <CreditCard className="w-4 h-4 text-emerald-300" />
            <span>{buttonText || `Pay ₹${amountInRupees.toFixed(2)} with Razorpay`}</span>
            <div className="flex items-center gap-1 ml-auto text-[10px] bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span>Razorpay</span>
            </div>
          </>
        )}
      </button>
    </div>
  );
}
