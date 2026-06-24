"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Loader2, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { t } = useTranslation();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/home`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-surface)' }} suppressHydrationWarning>
      
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-15 blur-[80px] pointer-events-none"
        style={{ background: 'var(--color-primary-fixed)' }} />

      <div className="w-full max-w-[380px] relative z-10 flex flex-col items-center">
        
        <div className="flex justify-center mb-10">
          <div className="w-[100px] h-[100px] rounded-[20px] flex items-center justify-center shadow-active"
            style={{ background: 'linear-gradient(135deg, #3f6530, #577f46)' }}>
            <span className="text-white font-bold text-3xl">GS</span>
          </div>
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
              Sign in with Google to continue
            </p>
          </div>

          {error && (
            <p className="text-[12px] font-semibold mb-4 text-center" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          <p className="text-[12px] mb-8 leading-relaxed text-center" style={{ color: 'var(--color-outline)' }}>
            By continuing you agree to our Terms & Privacy Policy
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 w-full h-[52px] rounded-[12px] font-bold text-[15px] text-white transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #3f6530, #577f46)',
              boxShadow: '0 6px 20px rgba(63, 101, 48, 0.28)',
            }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <User className="w-5 h-5" />
                Continue with Google
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

