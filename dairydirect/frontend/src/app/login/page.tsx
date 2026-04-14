"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { t } = useTranslation();

  const handleSendOtp = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (phone.length < 10) {
        setError('Please enter a valid 10-digit phone number');
        setIsLoading(false);
        return;
      }
      
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
      });

      if (otpError) throw otpError;
      router.push(`/verify?phone=${phone}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-surface)' }} suppressHydrationWarning>
      
      {/* Ambient blob */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-15 blur-[80px] pointer-events-none"
        style={{ background: 'var(--color-primary-fixed)' }} />

      <div className="w-full max-w-[380px] relative z-10 flex flex-col items-center">
        
        {/* Logo - Centered above Welcome Back */}
        <div className="flex justify-center mb-10">
          <img src="/logo.svg" alt="DairyDirect Logo" className="w-[100px] h-[100px] object-contain" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="w-full"
        >
          <div className="mb-8 text-center">
            <h2 className="font-extrabold text-[28px] tracking-tight mb-2" style={{ color: 'var(--color-on-surface)' }}>
              {t('welcomeBack')}
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>
              {t('enterMobileOtp')}
            </p>
          </div>

          {/* Inputs */}
          <div className="flex gap-2.5 mb-3">
            <div className="flex items-center justify-center px-3.5 h-[52px] rounded-[12px] shrink-0 font-semibold text-[14px]"
              style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}>
              🇮🇳 +91
            </div>
            
            <input
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              className="flex-1 h-[52px] rounded-[12px] px-4 text-[16px] font-medium tracking-wider outline-none transition-all"
              style={{
                background: 'var(--color-surface-container)',
                color: 'var(--color-on-surface)',
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[12px] font-semibold mb-3 text-center" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          <p className="text-[12px] mb-8 leading-relaxed text-center" style={{ color: 'var(--color-outline)' }}>
            {t('termsAndPrivacy')}
          </p>

          {/* CTA Button */}
          <button
            onClick={handleSendOtp}
            disabled={phone.length < 10 || isLoading}
            className="flex items-center justify-center gap-2.5 w-full h-[52px] rounded-[12px] font-bold text-[15px] text-white transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #3f6530, #577f46)',
              boxShadow: phone.length >= 10 ? '0 6px 20px rgba(63, 101, 48, 0.30)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {t('sendOtp')}
                <ArrowRight className="w-4.5 h-4.5" strokeWidth={2.5} />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
