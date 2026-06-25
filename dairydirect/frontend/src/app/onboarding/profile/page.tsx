"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { ArrowLeft, User, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { updateProfileName } from '@/lib/api/auth';
import { getUserAddresses } from '@/lib/api/addresses';

export default function ProfileOnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useStore(s => s.user);
  const updateProfileLocal = useStore(s => s.updateProfile);
  
  const [name, setName] = useState(user?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.name && user.name.trim() !== '') {
      setName(user.name);
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!user) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const result = await updateProfileName(user.id, name.trim());
      
      if (result.success) {
        updateProfileLocal({ name: name.trim() });
        
        // Check if user has addresses
        const addresses = await getUserAddresses(user.id);
        if (addresses.length === 0) {
          router.replace('/onboarding/address');
        } else {
          router.replace('/home');
        }
      } else {
        setError(result.error || 'Failed to save profile');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="px-6 pt-12 pb-6 border-b" style={{ borderColor: 'rgba(195,201,187,0.3)' }}>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full"
            style={{ color: 'var(--color-on-surface-variant)' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
            Complete Your Profile
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-outline)' }}>
          Please enter your details to continue
        </p>
      </div>

      <div className="flex-1 px-6 py-8 space-y-6">
        <div className="space-y-2">
          <label className="text-[12px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-outline)' }}>
            {t('fullName')}
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-outline)' }} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full h-14 pl-12 pr-4 rounded-[12px] text-[15px] font-medium outline-none"
              style={{ 
                background: 'var(--color-surface-container)', 
                color: 'var(--color-on-surface)',
                border: '2px solid var(--color-outline-variant)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--color-outline-variant)'}
            />
          </div>
        </div>

        {error && (
          <p className="text-[13px] font-bold" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        )}
      </div>

      <div className="px-6 pb-8">
        <button
          onClick={handleSave}
          disabled={isSubmitting || !name.trim()}
          className="w-full h-14 rounded-[12px] font-bold text-white flex items-center justify-center gap-2 transition-all"
          style={{
            background: isSubmitting || !name.trim() 
              ? 'var(--color-surface-container)' 
              : 'linear-gradient(135deg, #3f6530, #577f46)',
            color: isSubmitting || !name.trim() 
              ? 'var(--color-on-surface-variant)' 
              : 'white',
          }}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}