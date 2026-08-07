"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Navigation, Home, Briefcase, Plus, Search, Loader2, Check, CheckSquare, Square, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { updateProfileName } from '@/lib/api/auth';
import { saveAddressAPI, getUserAddresses } from '@/lib/api/addresses';
import { getCurrentUserLocation, reverseGeocodeCoords } from '@/lib/utils/geolocation';
import OrderTrackingMap from '@/components/shared/OrderTrackingMap';

import { supabase } from '@/lib/supabase';

function AddressOnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('return_to') || '/home';
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Home');
  const [isDefault, setIsDefault] = useState(false);
  const [hasExistingAddresses, setHasExistingAddresses] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  
  // Default coordinate (India - Delhi)
  const [coords, setCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const user = useStore(s => s.user);
  const setUser = useStore(s => s.setUser);
  const updateProfileLocal = useStore(s => s.updateProfile);

  // Check user profile & existing addresses
  useEffect(() => {
    async function initUserAndAddresses() {
      let activeUserId = user?.id;

      if (!activeUserId) {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser) {
          activeUserId = sbUser.id;
          const fallbackUser = {
            id: sbUser.id,
            name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || '',
            phone: sbUser.phone || '',
            email: sbUser.email || '',
            avatar_url: sbUser.user_metadata?.avatar_url || '',
            role: 'customer' as const,
          };
          setUser(fallbackUser);
          if (!name && fallbackUser.name) {
            setName(fallbackUser.name);
          }
        }
      } else if (user?.name && !name) {
        setName(user.name);
      }

      if (activeUserId) {
        getUserAddresses(activeUserId).then(existing => {
          if (existing.length === 0) {
            setIsDefault(true);
            setHasExistingAddresses(false);
          } else {
            setIsDefault(false);
            setHasExistingAddresses(true);
          }
        });
      }
    }

    initUserAndAddresses();
  }, [user]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const formatted = await reverseGeocodeCoords(lat, lng);
      setAddress(formatted);
    } catch (error) {
      console.error("Geocoding failed", error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleLocationChange = useCallback((newCoords: { lat: number; lng: number }) => {
    setCoords(newCoords);
    
    // Debounce reverse geocoding
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      reverseGeocode(newCoords.lat, newCoords.lng);
    }, 800);
  }, []);

  const handleUseLocation = async () => {
    setIsLocating(true);
    setLocationNotice(null);
    try {
      const loc = await getCurrentUserLocation();
      setCoords({ lat: loc.lat, lng: loc.lng });
      if (loc.address) {
        setAddress(loc.address);
      }
      setLocationNotice(
        loc.source === 'gps' 
          ? 'Pinpointed using GPS' 
          : 'Detected approximate location from network'
      );
    } catch (err: any) {
      console.warn("Location lookup error", err);
      setLocationNotice("Could not auto-detect location. Please enter or search your address.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSave = async () => {
    let activeUser = user;
    if (!activeUser) {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) {
        activeUser = {
          id: sbUser.id,
          name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || '',
          phone: sbUser.phone || '',
          email: sbUser.email || '',
          avatar_url: sbUser.user_metadata?.avatar_url || '',
          role: 'customer',
        };
        setUser(activeUser);
      }
    }

    if (!activeUser) {
      alert("User session not found. Please try logging in again.");
      router.replace('/login');
      return;
    }
    if (!address.trim()) {
      alert("Please select or enter a valid delivery address.");
      return;
    }
    if (!name.trim()) {
      alert("Please enter recipient name.");
      return;
    }

    setIsSaving(true);
    setIsSuccess(false);
    
    try {
      // 1. Update Profile Name if changed
      if (name.trim() !== activeUser.name) {
        await updateProfileName(activeUser.id, name.trim());
        updateProfileLocal({ name: name.trim() });
      }

      // 2. Determine the save label
      const finalType = type === 'Other' ? (customLabel.trim() || 'Other') : type;

      // 3. Save Address to user_addresses table with proper is_default flag
      const addressResult = await saveAddressAPI({
        userId: activeUser.id,
        label: finalType,
        address: address.trim(),
        lat: coords.lat,
        lng: coords.lng,
        isDefault: isDefault
      });
      
      if (addressResult.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.replace(returnTo);
        }, 1000);
      } else {
        if (addressResult.code === '42P01' || (addressResult.error && addressResult.error.includes('column'))) {
           alert("CRITICAL: Your database is missing the 'user_addresses' table. \n\nPLEASE RUN THE SQL MIGRATION IN SUPABASE DASHBOARD.");
        } else {
           throw new Error(addressResult.error || 'Failed to save address');
        }
      }
    } catch (err: any) {
      console.error("Save process failed:", err);
      alert(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const addressTypes = [
    { id: 'Home', label: t('homeType') || 'Home', icon: Home },
    { id: 'Office', label: t('officeType') || 'Office', icon: Briefcase },
    { id: 'Other', label: t('otherType') || 'Other', icon: Plus }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 max-w-xl mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mb-1">
          {t('deliveryAddressTitle') || 'Add Delivery Address'}
        </h1>
        <p className="text-muted text-xs sm:text-sm leading-relaxed">
          {t('whereDeliver') || 'Where should we deliver your fresh farm products?'}
        </p>
      </div>

      <div className="flex-1 px-6 space-y-6 pb-32 max-w-xl mx-auto w-full">
        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">
            {t('fullName') || 'Recipient Name'}
          </label>
          <div className="relative">
            <input 
              type="text" 
              placeholder={t('addressNamePlaceholder') || 'Enter your full name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 bg-surface-container rounded-2xl px-4 text-sm font-bold border-2 border-transparent focus:border-primary outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Search Bar / Manual Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">
              Complete Address
            </label>
            <button 
              type="button"
              onClick={handleUseLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 text-primary text-xs font-bold hover:underline active:scale-95 transition-all cursor-pointer"
            >
              {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
              {isLocating ? 'Locating...' : 'Use Current Location'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-4">
              {isGeocoding ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : <Search className="w-4 h-4 text-muted" />}
            </div>
            <textarea 
              placeholder="House/Flat number, Building, Street name, Area, City, Pincode"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full bg-surface-container rounded-2xl pl-11 pr-4 py-3 text-sm font-medium border-2 border-transparent focus:border-primary outline-none transition-all resize-none shadow-sm"
            />
          </div>

          {locationNotice && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-200">
              <Info className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{locationNotice}</span>
            </div>
          )}

          {/* Map Preview with Pinpoint */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-sand relative group">
            <OrderTrackingMap 
              customerLocation={coords} 
              height="220px" 
              interactive={true} 
              showCenterMarker={true}
              onLocationChange={handleLocationChange}
            />
            <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-bold text-gray-700 shadow-sm pointer-events-none">
              📍 Drag map to adjust pin
            </div>
          </div>
        </div>

        {/* Address Type Chips */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">{t('saveAs') || 'Save Address As'}</label>
          <div className="flex flex-wrap gap-2.5">
            {addressTypes.map(item => {
              const Icon = item.icon;
              const isSelected = type === item.id;
              
              if (item.id === 'Other' && isSelected) {
                return (
                  <motion.div 
                    key="custom-input"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    className="flex-1 min-w-[180px] relative"
                  >
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Grandma's House, Farm"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      className="w-full h-11 bg-primary/5 border-2 border-primary rounded-xl px-3 text-xs font-bold text-primary outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => { setType('Home'); setCustomLabel(''); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-primary/60 hover:text-primary"
                    >
                      Reset
                    </button>
                  </motion.div>
                );
              }

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setType(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-2 ${
                    isSelected 
                      ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                      : 'bg-white border-sand text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Address Checkbox */}
        <div 
          onClick={() => setIsDefault(prev => !prev)}
          className="flex items-center gap-3 p-3.5 bg-surface-container rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors select-none"
        >
          {isDefault ? (
            <CheckSquare className="w-5 h-5 text-primary" />
          ) : (
            <Square className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <p className="text-xs font-bold text-gray-900">Make this my default delivery address</p>
            <p className="text-[11px] text-gray-500">
              {hasExistingAddresses 
                ? 'Will be used as your primary address for quick checkouts.' 
                : 'Your primary delivery location.'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-sand z-50">
        <div className="max-w-xl mx-auto w-full">
          <button
            onClick={handleSave}
            disabled={!address.trim() || !name.trim() || isSaving || isSuccess}
            className={`w-full h-12 sm:h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${
              isSuccess 
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : isSaving
                  ? 'bg-primary/70 text-white cursor-wait'
                  : 'bg-primary text-white shadow-primary/20 disabled:opacity-50'
            }`}
          >
            {isSuccess ? (
              <>
                <Check className="w-5 h-5" strokeWidth={3} />
                Address Saved Successfully!
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving Address...
              </>
            ) : (
              'Save Delivery Address'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddressOnboarding() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>Loading...</p>
        </div>
      </div>
    }>
      <AddressOnboardingInner />
    </Suspense>
  );
}
