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
    <div className="flex flex-col min-h-screen bg-white">
      <div className="px-6 pt-12 pb-6 border-b" style={{ borderColor: 'rgba(195,201,187,0.3)' }}>
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full cursor-pointer hover:bg-sand/20"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#4a5c43] px-2 mb-1">
              FIRST NAME
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className="w-full bg-[#f3f5f0] text-dark font-bold text-base px-4 py-3 rounded-full outline-none border-2 border-transparent focus:border-[#4b6a41] transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#4a5c43] px-2 mb-1">
              LAST NAME
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className="w-full bg-[#f3f5f0] text-dark font-bold text-base px-4 py-3 rounded-full outline-none border-2 border-transparent focus:border-[#4b6a41] transition-all"
            />
          </div>
        </div>

        {error && (
          <p className="text-[13px] font-bold text-red-600 px-2">
            {error}
          </p>
        )}
      </div>

      <div className="px-6 pb-8">
        <button
          onClick={handleSave}
          disabled={isSubmitting || !firstName.trim()}
          className="w-full h-14 rounded-full font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          style={{
            background: isSubmitting || !firstName.trim() 
              ? '#e0e4da' 
              : 'linear-gradient(135deg, #375e2e, #577f46)',
            color: isSubmitting || !firstName.trim() 
              ? '#8c9485' 
              : 'white',
          }}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 stroke-[2.5]" />}
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}