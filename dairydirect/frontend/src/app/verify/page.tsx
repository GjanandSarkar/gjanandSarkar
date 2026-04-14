"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { OTPInput } from '@/components/ui/OTPInput';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

function VerifyContent() {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const { t } = useTranslation();

  useEffect(() => {
    // Basic validation
    if (!phone) {
       router.replace('/login');
       return;
    }
    
    const interval = setInterval(() => setTimer(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(interval);
  }, [phone, router]);

  const handleVerify = async (code: string = otp) => {
    if (code.length < 6) return;
    setIsLoading(true);
    setError('');

    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: code,
        type: 'sms'
      });

      if (verifyError) throw verifyError;
      const session = verifyData.session;

      if (!session) throw new Error('Verification failed. No session created.');

      // Sync with backend (ensure profile is fully created/updated)
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: session.access_token, 
          type: 'supabase',
          phone: phone || session.user.phone
        })
      });

      const data = await res.json();
      if (data.user?.name) {
        router.replace('/home');
      } else {
        router.replace('/onboarding/address');
      }
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      setError(err.message || t('incorrectOtp'));
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError('');

    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
      });
      if (resendError) throw resendError;
      
      setTimer(60); // Longer cooldown
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{ background: 'var(--color-surface)' }}>
      
      {/* Ambient blob */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-15 blur-[80px] pointer-events-none"
        style={{ background: 'var(--color-primary-fixed)' }} />

      {/* Back button */}
      <button onClick={() => router.back()}
        className="absolute top-6 left-5 w-9 h-9 rounded-[10px] flex items-center justify-center transition-all active:scale-95 z-20"
        style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)' }}>
        <ArrowLeft className="w-4.5 h-4.5" />
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-[380px] relative z-10"
      >
        <h1 className="font-extrabold text-[28px] tracking-tight mb-2 text-center"
          style={{ color: 'var(--color-on-surface)' }}>
          {t('enterOtp')}
        </h1>
        <p className="text-[15px] mb-8 text-center" style={{ color: 'var(--color-on-surface-variant)' }}>
          {t('sentCodeTo')} <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
            +91 {phone.substring(0, 5)} {phone.substring(5)}
          </span>
        </p>

        {/* OTP Boxes */}
        <div className="mb-6 flex justify-center">
          <OTPInput length={6} onComplete={handleVerify} error={!!error} />
        </div>

        {error && (
          <p className="text-center text-[13px] font-semibold mb-5"
            style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        )}

        {/* Resend */}
        <div className="text-center text-[13px] mb-8" style={{ color: 'var(--color-outline)' }}>
          {t('didntReceive')}{' '}
          {timer > 0 ? (
            <span className="font-semibold">{t('resendIn')} 00:{timer.toString().padStart(2, '0')}</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-bold"
              style={{ color: 'var(--color-primary)' }}>
              {resending ? '...' : t('resend')}
            </button>
          )}
        </div>

        {/* Verify CTA */}
        <button
          onClick={() => handleVerify(otp)}
          disabled={isLoading || otp.length < 6}
          className="w-full h-[52px] rounded-[12px] font-bold text-[15px] text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #3f6530, #577f46)',
            boxShadow: '0 6px 20px rgba(63, 101, 48, 0.28)',
          }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('verifyAndContinue')
          )}
        </button>
      </motion.div>
    </div>
  );
}

export default function VerifyScreen() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
