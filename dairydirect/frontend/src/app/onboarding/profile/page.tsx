"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { ArrowLeft, User, Loader2, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { updateProfileName } from '@/lib/api/auth';
import { getUserAddresses } from '@/lib/api/addresses';

export default function ProfileOnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useStore(s => s.user);
  const updateProfileLocal = useStore(s => s.updateProfile);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.first_name || user?.last_name) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
    } else if (user?.name && user.name.trim() !== '') {
      const parts = user.name.trim().split(/\s+/);
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
  }, [user]);

  const handleSave = async () => {
    const fName = firstName.trim();
    const lName = lastName.trim();
    const fullName = `${fName} ${lName}`.trim();
    if (!fullName) {
      setError('Please enter your first name');
      return;
    }

    if (!user) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const result = await updateProfileName(user.id, fName, lName);
      
      if (result.success) {
        updateProfileLocal({
          first_name: fName,
          last_name: lName,
          name: fullName,
        });
        
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
    <div className="flex flex-col min-h-screen bg-background">
      <div className="px-6 pt-10 pb-6 border-b border-border bg-surface max-w-xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-2">
          <button 
            type="button"
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-lg cursor-pointer text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Complete Your Profile
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-foreground-muted">
          Please enter your name as you'd like it to appear on orders
        </p>
      </div>

      <div className="flex-1 px-6 py-8 space-y-6 max-w-xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Ramesh"
              className="w-full bg-surface text-foreground font-medium text-sm px-4 py-2.5 rounded-xl outline-none border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Patel"
              className="w-full bg-surface text-foreground font-medium text-sm px-4 py-2.5 rounded-xl outline-none border border-border focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
            {error}
          </p>
        )}
      </div>

      <div className="px-6 pb-8 max-w-xl mx-auto w-full">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting || !firstName.trim()}
          className="w-full h-12 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 stroke-[2.5]" />}
          <span>{isSubmitting ? 'Saving...' : 'Continue'}</span>
        </button>
      </div>
    </div>
  );
}