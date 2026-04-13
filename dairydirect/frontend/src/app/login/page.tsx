"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Loader2, Leaf, ArrowRight, Shield, Star, Truck, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { t } = useTranslation();

  const handleSendOtp = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (loginMethod === 'phone') {
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
      } else {
        // Email OTP
        if (!email || !email.includes('@')) {
          setError('Please enter a valid email address');
          setIsLoading(false);
          return;
        }

        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
          }
        });

        if (otpError) throw otpError;
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      setIsLoading(false);
    }
  };

  const farmFacts = [
    { title: "Farm to Door", text: "Fresh A2 milk delivered within 3 hours of milking." },
    { title: "Pure Quality", text: "Zero preservatives. Zero hormones. 100% natural." },
    { title: "Happy Cows", text: "Our cows are pasture-raised and grain-fed with love." },
    { title: "Local Impact", text: "Proudly supporting 50+ local farming families." }
  ];

  const features = [
    { icon: Truck, text: 'Free delivery on orders above ₹299' },
    { icon: Star, text: '4.9★ rated by 2,400+ customers' },
    { icon: Shield, text: 'FSSAI certified A2 dairy products' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--color-surface)' }} suppressHydrationWarning>
      {/* ══ LEFT PANEL (Desktop only) ══ */}
      <div className="hidden md:flex md:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #2e4d22 0%, #3f6530 40%, #4a7a38 70%, #537e64 100%)' }}>
        
        {/* Ambient blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 blur-[80px]"
          style={{ background: '#a7d392' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15 blur-[60px]"
          style={{ background: '#bfedce' }} />
        <div className="absolute top-1/2 -translate-y-1/2 right-12 opacity-10">
          <Leaf className="w-48 h-48 text-white" strokeWidth={0.5} />
        </div>

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <img src="/logo.svg" alt="DairyDirect Logo" className="w-10 h-10 object-contain" />
            <div>
              <span className="font-extrabold text-white text-xl tracking-tight">DairyDirect</span>
              <br />
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Farm to Doorstep</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-white font-extrabold leading-[1.08] mb-5"
              style={{ fontSize: 'clamp(36px, 3.5vw, 52px)', letterSpacing: '-0.025em' }}>
              The Freshest<br />Milk on Your<br />Doorstep. 🌿
            </h1>
            <p className="text-white/70 text-[16px] leading-relaxed max-w-[340px]">
              Farm-sourced A2 milk, artisanal dairy, and daily essentials — delivered fresh before sunrise.
            </p>
          </motion.div>
        </div>

        {/* Dynamic Demo Data Overlay */}
        <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-[400px]">
          <h3 className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Did you know?</h3>
          <div className="space-y-4">
            {farmFacts.map((fact, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex flex-col"
              >
                <span className="text-white font-bold text-sm tracking-tight">{fact.title}</span>
                <span className="text-white/60 text-xs mt-0.5">{fact.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feature list */}
        <div className="relative z-10">
          <div className="flex flex-col gap-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-white/15 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <span className="text-white/80 text-[14px] font-medium">{f.text}</span>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-[11px] font-medium mt-8">© 2025 DairyDirect. All rights reserved.</p>
        </div>
      </div>

      {/* ══ RIGHT PANEL — Login Form ══ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:px-16 relative overflow-hidden">
        
        {/* Mobile hero blob */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-15 blur-[60px] md:hidden"
          style={{ background: 'var(--color-primary-fixed)' }} />

        {/* Mobile Logo */}
        <div className="md:hidden flex items-center gap-2.5 mb-10 relative z-10">
          <img src="/logo.svg" alt="DairyDirect Logo" className="w-9 h-9 object-contain" />
          <div>
            <span className="font-extrabold text-[18px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>DairyDirect</span>
            <br />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>Farm to Doorstep</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-[380px] relative z-10"
        >
          <div className="mb-8">
            <h2 className="font-extrabold text-[28px] tracking-tight mb-2" style={{ color: 'var(--color-on-surface)' }}>
              {t('welcomeBack')}
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>
              {t('enterMobileOtp')}
            </p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex p-1 rounded-[14px] mb-8" style={{ background: 'var(--color-surface-container)' }}>
            <button
              onClick={() => setLoginMethod('phone')}
              className="flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all"
              style={loginMethod === 'phone' ? { background: 'white', color: 'var(--color-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } : { color: 'var(--color-outline)' }}
            >
              Phone Number
            </button>
            <button
              onClick={() => setLoginMethod('email')}
              className="flex-1 py-2.5 rounded-[10px] text-[13px] font-bold transition-all"
              style={loginMethod === 'email' ? { background: 'white', color: 'var(--color-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } : { color: 'var(--color-outline)' }}
            >
              Email Address
            </button>
          </div>

          {/* Inputs */}
          {loginMethod === 'phone' ? (
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
          ) : (
            <div className="mb-3">
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                className="w-full h-[52px] rounded-[12px] px-4 text-[16px] font-medium outline-none transition-all"
                style={{
                  background: 'var(--color-surface-container)',
                  color: 'var(--color-on-surface)',
                }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          <p className="text-[12px] mb-8 leading-relaxed" style={{ color: 'var(--color-outline)' }}>
            {t('termsAndPrivacy')}
          </p>

          {/* CTA Button */}
          <button
            onClick={handleSendOtp}
            disabled={(loginMethod === 'phone' ? phone.length < 10 : !email) || isLoading}
            className="flex items-center justify-center gap-2.5 w-full h-[52px] rounded-[12px] font-bold text-[15px] text-white transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #3f6530, #577f46)',
              boxShadow: (loginMethod === 'phone' ? phone.length >= 10 : email.length > 3) ? '0 6px 20px rgba(63, 101, 48, 0.30)' : 'none',
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

          {/* Role Choice hint */}
          <div className="flex items-center gap-2 mt-5 px-4 py-3 rounded-[12px]"
            style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}>
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--color-primary)' }} strokeWidth={2} />
            <p className="text-[12px] font-medium leading-tight">
              {t('loginHint')}
            </p>
          </div>
          <div className="md:hidden mt-10 flex flex-col gap-2.5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-primary)' }}>
                  <f.icon className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <span className="text-[12px] font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
