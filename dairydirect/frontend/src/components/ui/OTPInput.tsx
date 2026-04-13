"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  error?: boolean;
}

export function OTPInput({ length = 6, onComplete, error }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    const combinedOtp = newOtp.join('');
    if (combinedOtp.length === length) {
      onComplete(combinedOtp);
    }

    if (value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    const newOtp = [...otp];
    let lastFilledIndex = -1;
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
      lastFilledIndex = i;
    }
    setOtp(newOtp);

    const combinedOtp = newOtp.join('');
    if (combinedOtp.length === length) {
      onComplete(combinedOtp);
    }

    if (lastFilledIndex < length - 1 && inputRefs.current[lastFilledIndex + 1]) {
      inputRefs.current[lastFilledIndex + 1]?.focus();
    } else if (lastFilledIndex === length - 1) {
      inputRefs.current[lastFilledIndex]?.blur();
    }
  };

  return (
    <div className="flex gap-2 justify-between w-full">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={cn(
            "w-[52px] h-[52px] rounded-[10px] border border-sand bg-white text-center text-2xl font-semibold text-dark shadow-sm transition-colors",
            "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary",
            error && "border-red focus:border-red focus:ring-red"
          )}
        />
      ))}
    </div>
  );
}
