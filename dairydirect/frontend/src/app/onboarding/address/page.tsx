"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Navigation, Home, Briefcase, Plus, Search, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { updateProfileName } from '@/lib/api/auth';
import { saveAddressAPI } from '@/lib/api/addresses';
import OrderTrackingMap from '@/components/shared/OrderTrackingMap';

export default function AddressOnboarding() {
  const router = useRouter();
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Home');
  const [isLocating, setIsLocating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  
  // Default coordinate (India - Delhi)
  const [coords, setCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const user = useStore(s => s.user);
  const updateProfileLocal = useStore(s => s.updateProfile);

  // Pre-fill name if available
  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name);
    }
  }, [user]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat)) {
        setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } else {
        setAddress('Manual entry required');
      }
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

  const handleUseLocation = () => {
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setCoords(newCoords);
        await reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error obtaining location", error);
        alert("Failed to get your location. Please ensure location services are enabled.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSave = async () => {
    if (!user) {
      alert("User session not found. Please try logging in again.");
      return;
    }
    if (!address) {
      alert("Please select or enter an address first.");
      return;
    }
    if (!name) {
      alert("Please enter your name.");
      return;
    }

    setIsSaving(true);
    setIsSuccess(false);
    
    try {
      // 1. Update Profile Name
      const nameResult = await updateProfileName(user.id, name);
      if (!nameResult.success) {
        throw new Error(`Failed to save name: ${nameResult.error}`);
      }

      // 2. Determine the save label
      const finalType = type === 'Other' ? (customLabel || 'Other') : type;

      // 3. Save Address to user_addresses table
      const addressResult = await saveAddressAPI({
        userId: user.id,
        label: finalType,
        address: address,
        lat: coords.lat,
        lng: coords.lng,
        isDefault: true
      });
      
      if (addressResult.success) {
        setIsSuccess(true);
        updateProfileLocal({ name, address });
        setTimeout(() => {
          router.replace('/home');
        }, 1500);
      } else {
        if (addressResult.code === '42P01' || (addressResult.error && addressResult.error.includes('column'))) {
           alert("CRITICAL: Your database is missing the 'user_addresses' table. \n\nPLEASE RUN THE SQL MIGRATION IN SUPABASE DASHBOARD.");
        } else {
           throw new Error(addressResult.error || 'Unknown database error');
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
    { id: 'Home', label: t('homeType'), icon: Home },
    { id: 'Office', label: t('officeType'), icon: Briefcase },
    { id: 'Other', label: t('otherType'), icon: Plus }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-3xl font-black text-on-surface tracking-tight mb-2">{t('deliveryAddressTitle')}</h1>
        <p className="text-muted text-sm leading-relaxed">
          {t('whereDeliver')}
        </p>
      </div>

      <div className="flex-1 px-6 space-y-8 pb-32">
        {/* Name Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">{t('addressLabel')}</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder={t('addressNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-14 bg-surface-container rounded-2xl px-5 text-sm font-bold border-2 border-transparent focus:border-primary outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Search Bar / Manual Input */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">{t('deliveryAddressTitle')}</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {isGeocoding ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Search className="w-5 h-5 text-muted" />}
            </div>
            <textarea 
              placeholder={t('searchAddressPlaceholder')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full min-h-[80px] bg-surface-container rounded-2xl pl-12 pr-5 py-4 text-sm font-medium border-2 border-transparent focus:border-primary outline-none transition-all resize-none shadow-sm"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button 
              onClick={handleUseLocation}
              disabled={isLocating}
              className="flex items-center gap-2.5 text-primary text-[13px] font-bold active:scale-95 transition-all"
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              {t('useCurrentLocation')}
            </button>
            
            <div className="text-[10px] text-muted-foreground italic">
              Drag map to pinpoint location
            </div>
          </div>
          
          <div className="mt-2 rounded-3xl overflow-hidden shadow-2xl border-2 border-sand relative group">
            <OrderTrackingMap 
              customerLocation={coords} 
              height="350px" 
              interactive={true} 
              showCenterMarker={true}
              onLocationChange={handleLocationChange}
            />
            {/* Center crosshair helper */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
               <div className="w-2 h-2 bg-primary rounded-full ring-8 ring-primary/20" />
            </div>
          </div>
        </div>

        {/* Address Type Chips */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted ml-1">{t('saveAs')}</label>
          <div className="flex flex-wrap gap-3">
            {addressTypes.map(item => {
              const Icon = item.icon;
              const isSelected = type === item.id;
              
              if (item.id === 'Other' && isSelected) {
                return (
                  <motion.div 
                    key="custom-input"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    className="flex-1 min-w-[200px] relative"
                  >
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. Grandma's House"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      className="w-full h-[46px] bg-primary/5 border-2 border-primary rounded-2xl px-4 text-sm font-bold text-primary outline-none"
                    />
                    <button 
                      onClick={() => { setType('Home'); setCustomLabel(''); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-primary/60"
                    >
                      Reset
                    </button>
                  </motion.div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setType(item.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[13px] font-bold transition-all border-2 ${
                    isSelected 
                      ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                      : 'bg-white border-sand text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-sand z-50">
        <button
          onClick={handleSave}
          disabled={!address || !name || isSaving || isSuccess}
          className={`w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${
            isSuccess 
              ? 'bg-green-600 text-white shadow-green-200'
              : isSaving
                ? 'bg-primary/70 text-white cursor-wait'
                : 'bg-primary text-white shadow-primary/20 disabled:opacity-50'
          }`}
        >
          {isSuccess ? (
            <>
              <Check className="w-5 h-5" strokeWidth={3} />
              {t('savedSuccessfully')}
            </>
          ) : isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            t('confirmSaveAddress')
          )}
        </button>
      </div>
    </div>
  );
}
