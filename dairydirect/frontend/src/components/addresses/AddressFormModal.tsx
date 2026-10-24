"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  MapPin,
  Loader2,
  Home,
  Building2,
  Briefcase,
  Layers,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Navigation,
} from 'lucide-react';
import { INDIAN_STATES_AND_UTS } from '@/lib/constants/states';
import { POPULAR_COUNTRIES } from '@/lib/constants/countries';
import { SearchableCombobox } from '@/components/ui/SearchableCombobox';
import {
  reverseGeocodeDetailed,
  fetchDetailedIPLocation,
  type DetailedAddressLocation,
} from '@/lib/utils/geolocation';
import type { UserAddress, CreateAddressInput, AddressType } from '@/lib/api/addresses';

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (addressData: CreateAddressInput) => Promise<boolean>;
  initialData?: UserAddress | null;
  isSaving?: boolean;
}

const ADDRESS_TYPES: { type: AddressType; label: string; icon: React.ElementType }[] = [
  { type: 'house', label: 'House', icon: Home },
  { type: 'apartment', label: 'Apartment', icon: Building2 },
  { type: 'business', label: 'Business', icon: Briefcase },
  { type: 'other', label: 'Other', icon: Layers },
];

export function AddressFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving = false,
}: AddressFormModalProps) {
  const isEditMode = Boolean(initialData?.id);

  // Form State
  const [addressType, setAddressType] = useState<AddressType>('house');
  const [country, setCountry] = useState('India');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pincode, setPincode] = useState('');
  const [flatHouseBuilding, setFlatHouseBuilding] = useState('');
  const [areaStreet, setAreaStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [townCity, setTownCity] = useState('');
  const [state, setState] = useState('Gujarat');
  const [saturdayDelivery, setSaturdayDelivery] = useState(true);
  const [sundayDelivery, setSundayDelivery] = useState(true);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // UI state
  const [showInstructions, setShowInstructions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const pendingLocationRef = useRef<DetailedAddressLocation | null>(null);

  // Focus trap ref
  const modalRef = useRef<HTMLDivElement>(null);

  // Combobox options
  const stateOptions = useMemo(() => {
    return INDIAN_STATES_AND_UTS.map((st) => ({
      value: st.name,
      label: st.name,
      badge: st.type === 'ut' ? 'UT' : 'State',
    }));
  }, []);

  const countryOptions = useMemo(() => {
    return POPULAR_COUNTRIES.map((c) => ({
      value: c.name,
      label: c.name,
      badge: c.code,
    }));
  }, []);

  // Reset or Populate fields on open/edit change
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setAddressType(initialData.address_type || 'house');
        setCountry(initialData.country || 'India');
        setFullName(initialData.full_name || '');
        setMobileNumber(initialData.mobile_number || '');
        setPincode(initialData.pincode || '');
        setFlatHouseBuilding(initialData.flat_house_building || initialData.building || initialData.apartment || '');
        setAreaStreet(initialData.area_street_sector_village || initialData.street || '');
        setLandmark(initialData.landmark || '');
        setTownCity(initialData.town_city || initialData.city || '');
        setState(initialData.state || 'Gujarat');
        setSaturdayDelivery(initialData.saturday_delivery ?? true);
        setSundayDelivery(initialData.sunday_delivery ?? true);
        const inst = initialData.delivery_instructions || initialData.instructions || '';
        setDeliveryInstructions(inst);
        setShowInstructions(Boolean(inst.trim()));
        setIsDefault(Boolean(initialData.is_default));
        setLatitude(initialData.latitude ?? initialData.lat ?? null);
        setLongitude(initialData.longitude ?? initialData.lng ?? null);
      } else {
        setAddressType('house');
        setCountry('India');
        setFullName('');
        setMobileNumber('');
        setPincode('');
        setFlatHouseBuilding('');
        setAreaStreet('');
        setLandmark('');
        setTownCity('');
        setState('Gujarat');
        setSaturdayDelivery(true);
        setSundayDelivery(true);
        setDeliveryInstructions('');
        setShowInstructions(false);
        setIsDefault(false);
        setLatitude(null);
        setLongitude(null);
      }
      setValidationErrors({});
      setLocationNotice(null);
      setShowOverwriteConfirm(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Apply Reverse Geocoded fields
  const applyLocationData = (loc: DetailedAddressLocation) => {
    // IMPORTANT: Never overwrite flat/house/building
    if (loc.area) setAreaStreet((prev) => prev || loc.area);
    if (loc.street) setAreaStreet((prev) => (prev ? `${loc.street}, ${prev}` : loc.street));
    if (loc.city) setTownCity(loc.city);
    if (loc.state) {
      const matchedState = INDIAN_STATES_AND_UTS.find(
        (s) => s.name.toLowerCase() === loc.state.toLowerCase()
      );
      if (matchedState) setState(matchedState.name);
    }
    if (loc.pincode) setPincode(loc.pincode);
    if (loc.country) setCountry(loc.country);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);

    setLocationNotice({
      text: 'Location fields detected successfully! Please enter your Flat / House number manually.',
      type: 'success',
    });
    setTimeout(() => setLocationNotice(null), 5000);
  };

  // Helper to fallback to IP-based location detection
  const attemptIPLocationFallback = async (reasonNotice?: string): Promise<boolean> => {
    try {
      setLocationNotice({
        text: 'Detecting your location via network...',
        type: 'info',
      });
      const ipResult = await fetchDetailedIPLocation();
      if (ipResult && ipResult.location) {
        const hasExistingData = Boolean(areaStreet || townCity || pincode);
        if (hasExistingData) {
          pendingLocationRef.current = ipResult.location;
          setShowOverwriteConfirm(true);
        } else {
          applyLocationData(ipResult.location);
        }
        setLocationNotice({
          text:
            reasonNotice ||
            'Filled in from your network location. This is approximate, so please check the pincode and city before saving, and add your flat / house number.',
          type: 'info',
        });
        setTimeout(() => setLocationNotice(null), 7000);
        return true;
      }
    } catch (e) {
      console.warn('IP location fallback failed:', e);
    }
    return false;
  };

  // Browser Geolocation Handler with Automatic IP Fallback
  const handleUseMyLocation = () => {
    setIsLocating(true);
    setLocationNotice(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      attemptIPLocationFallback('Auto-filled from network (Browser GPS not supported).').finally(() => {
        setIsLocating(false);
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const detailed = await reverseGeocodeDetailed(lat, lng);
          if (detailed) {
            // Check if user already typed data in area or city
            const hasExistingData = Boolean(areaStreet || townCity || pincode);
            if (hasExistingData) {
              pendingLocationRef.current = detailed;
              setShowOverwriteConfirm(true);
            } else {
              applyLocationData(detailed);
            }
          } else {
            setLatitude(lat);
            setLongitude(lng);
            setLocationNotice({
              text: 'Coordinates pinpointed, but address details were unavailable. Please enter details manually.',
              type: 'info',
            });
          }
        } catch (err) {
          await attemptIPLocationFallback('GPS lookup timed out. Detected location via network.');
        } finally {
          setIsLocating(false);
        }
      },
      async (err) => {
        // Fall back to the network location so the user is never stuck, but
        // describe what actually happened rather than blaming the browser for
        // every failure mode.
        const reason =
          err.code === err.PERMISSION_DENIED
            ? 'Location access was declined, so we used your network location instead.'
            : err.code === err.TIMEOUT
              ? 'Your device took too long to get a GPS fix, so we used your network location instead.'
              : 'Your device could not provide a GPS fix, so we used your network location instead.';

        const success = await attemptIPLocationFallback(
          `${reason} It is approximate - please check the pincode and city before saving.`
        );
        setIsLocating(false);

        if (!success) {
          if (err.code === err.PERMISSION_DENIED) {
            setLocationNotice({
              text: 'Location access is blocked for this site. Open your browser site settings (the icon to the left of the address bar), set Location to Allow, then try again - or just type the address in.',
              type: 'error',
            });
          } else if (err.code === err.TIMEOUT) {
            setLocationNotice({
              text: 'Getting your location timed out. Moving somewhere with a clearer view of the sky can help, or enter the address manually.',
              type: 'error',
            });
          } else {
            setLocationNotice({
              text: 'We could not detect your location. Please enter the address manually.',
              type: 'error',
            });
          }
        }
      },
      // A delivery address needs a real GPS fix. enableHighAccuracy was false
      // with a 60s cache, which let the browser hand back a coarse, cached,
      // often network-derived position - the very thing the fallback exists
      // for. GPS needs longer than 6s from a cold start.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Client-side Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Please enter at least 2 characters';
    }

    const cleanPhone = mobileNumber.trim().replace(/\D/g, '');
    const validIndianPhone = cleanPhone.length === 10 && /^[6-9]\d{9}$/.test(cleanPhone);
    if (!mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    } else if (!validIndianPhone) {
      errors.mobileNumber = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
    }

    const cleanPin = pincode.trim();
    if (!cleanPin) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(cleanPin)) {
      errors.pincode = 'Pincode must be exactly 6 digits';
    }

    if (!flatHouseBuilding.trim()) {
      errors.flatHouseBuilding = 'Flat, house no., or building name is required';
    }

    if (!areaStreet.trim()) {
      errors.areaStreet = 'Area, street, or sector is required';
    }

    if (!townCity.trim()) {
      errors.townCity = 'Town or city is required';
    }

    if (!country.trim()) {
      errors.country = 'Country is required';
    }

    if (!state.trim()) {
      errors.state = 'State is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const cleanPhone = mobileNumber.trim().replace(/^(\+91|\+)/, '').replace(/\D/g, '').slice(-10);

    const payload: CreateAddressInput = {
      address_type: addressType,
      country: country.trim() || 'India',
      full_name: fullName.trim(),
      mobile_number: cleanPhone,
      pincode: pincode.trim(),
      flat_house_building: flatHouseBuilding.trim(),
      area_street_sector_village: areaStreet.trim(),
      landmark: landmark.trim() || null,
      town_city: townCity.trim(),
      state: state.trim(),
      saturday_delivery: saturdayDelivery,
      sunday_delivery: sundayDelivery,
      delivery_instructions: deliveryInstructions.trim() || null,
      is_default: isDefault,
      latitude: latitude,
      longitude: longitude,
    };

    const success = await onSave(payload);
    if (success) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-foreground/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="bg-surface w-full max-w-xl rounded-3xl shadow-2xl border border-border overflow-hidden my-6 animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-muted/70">
          <div>
            <h2 id="address-modal-title" className="text-base sm:text-lg font-bold text-foreground">
              {isEditMode ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Enter your complete address details so we can deliver accurately.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close address form"
            className="p-2 text-foreground-muted hover:text-foreground hover:bg-border/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Location Notice / Feedback Banner */}
          {locationNotice && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 transition-all ${
                locationNotice.type === 'error'
                  ? 'bg-error-bg text-error border border-error/20'
                  : locationNotice.type === 'success'
                  ? 'bg-success-bg text-success border border-success/20'
                  : 'bg-info-bg text-blue-800 border border-info/20'
              }`}
            >
              {locationNotice.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error" />
              ) : locationNotice.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-success" />
              ) : (
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-info" />
              )}
              <span>{locationNotice.text}</span>
            </div>
          )}

          {/* Overwrite Confirmation Dialog */}
          {showOverwriteConfirm && (
            <div className="p-4 bg-warning-bg border border-warning/20 rounded-2xl text-xs text-warning space-y-2">
              <p className="font-semibold">Update existing address fields with detected GPS location?</p>
              <p className="text-warning leading-relaxed">
                This will fill Area, City, State, and Pincode. Your Flat/House number will remain untouched.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (pendingLocationRef.current) applyLocationData(pendingLocationRef.current);
                    setShowOverwriteConfirm(false);
                  }}
                  className="px-3 py-1.5 bg-warning hover:bg-warning text-on-warning font-semibold rounded-lg text-xs transition-colors"
                >
                  Yes, Update Fields
                </button>
                <button
                  type="button"
                  onClick={() => setShowOverwriteConfirm(false)}
                  className="px-3 py-1.5 bg-surface border border-warning text-warning font-semibold rounded-lg text-xs hover:bg-warning-bg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Quick Action: Use My Location */}
          <div className="flex items-center justify-between gap-3 bg-success-bg/60 border border-success-bg p-3.5 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-success-bg text-success flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Quick Fill via Geolocation</p>
                <p className="text-[11px] text-foreground-muted">Auto-fills city, area & pincode from your device</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-success hover:bg-success text-on-success font-semibold text-xs rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Locating...
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  Use My Location
                </>
              )}
            </button>
          </div>

          {/* Section: Address Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
              Address Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ADDRESS_TYPES.map(({ type, label, icon: Icon }) => {
                const isSelected = addressType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAddressType(type)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-success bg-success-bg text-success shadow-sm ring-1 ring-emerald-500'
                        : 'border-border bg-surface text-foreground hover:border-border hover:bg-surface-muted'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-success' : 'text-foreground-muted'}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Country / Region */}
          <div>
            <label htmlFor="country" className="block text-xs font-bold text-foreground mb-1">
              Country/Region *
            </label>
            <SearchableCombobox
              id="country"
              value={country}
              onChange={(val) => setCountry(val)}
              options={countryOptions}
              placeholder="Select or enter country"
              error={validationErrors.country}
              allowCustom={true}
            />
            {validationErrors.country && (
              <p className="text-[11px] text-error mt-1">{validationErrors.country}</p>
            )}
          </div>

          {/* Full Name & Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold text-foreground mb-1">
                Full name (First and Last name) *
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className={`w-full h-11 px-3.5 bg-surface border rounded-xl text-xs font-medium text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  validationErrors.fullName
                    ? 'border-error focus:ring-rose-500/20 focus:border-error'
                    : 'border-border focus:ring-emerald-500/20 focus:border-success'
                }`}
              />
              {validationErrors.fullName && (
                <p className="text-[11px] text-error mt-1">{validationErrors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="mobileNumber" className="block text-xs font-bold text-foreground mb-1">
                Mobile number *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-semibold text-foreground-muted select-none">
                  +91
                </span>
                <input
                  id="mobileNumber"
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit number"
                  className={`w-full h-11 pl-12 pr-3.5 bg-surface border rounded-xl text-xs font-medium text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    validationErrors.mobileNumber
                      ? 'border-error focus:ring-rose-500/20 focus:border-error'
                      : 'border-border focus:ring-emerald-500/20 focus:border-success'
                  }`}
                />
              </div>
              {validationErrors.mobileNumber && (
                <p className="text-[11px] text-error mt-1">{validationErrors.mobileNumber}</p>
              )}
            </div>
          </div>

          {/* Pincode & Flat/House/Building */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="pincode" className="block text-xs font-bold text-foreground mb-1">
                Pincode *
              </label>
              <input
                id="pincode"
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="6 digits"
                className={`w-full h-11 px-3.5 bg-surface border rounded-xl text-xs font-medium text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  validationErrors.pincode
                    ? 'border-error focus:ring-rose-500/20 focus:border-error'
                    : 'border-border focus:ring-emerald-500/20 focus:border-success'
                }`}
              />
              {validationErrors.pincode && (
                <p className="text-[11px] text-error mt-1">{validationErrors.pincode}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="flatHouseBuilding" className="block text-xs font-bold text-foreground mb-1">
                Flat, House no., Building, Company, Apartment *
              </label>
              <input
                id="flatHouseBuilding"
                type="text"
                value={flatHouseBuilding}
                onChange={(e) => setFlatHouseBuilding(e.target.value)}
                placeholder="e.g. Flat 402, Royal Residency"
                className={`w-full h-11 px-3.5 bg-surface border rounded-xl text-xs font-medium text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  validationErrors.flatHouseBuilding
                    ? 'border-error focus:ring-rose-500/20 focus:border-error'
                    : 'border-border focus:ring-emerald-500/20 focus:border-success'
                }`}
              />
              {validationErrors.flatHouseBuilding && (
                <p className="text-[11px] text-error mt-1">{validationErrors.flatHouseBuilding}</p>
              )}
            </div>
          </div>

          {/* Area / Street / Sector */}
          <div>
            <label htmlFor="areaStreet" className="block text-xs font-bold text-foreground mb-1">
              Area, Street, Sector, Village *
            </label>
            <input
              id="areaStreet"
              type="text"
              value={areaStreet}
              onChange={(e) => setAreaStreet(e.target.value)}
              placeholder="e.g. S.G. Highway, Opp. City Mall"
              className={`w-full h-11 px-3.5 bg-surface border rounded-xl text-xs font-medium text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                validationErrors.areaStreet
                  ? 'border-error focus:ring-rose-500/20 focus:border-error'
                  : 'border-border focus:ring-emerald-500/20 focus:border-success'
              }`}
            />
            {validationErrors.areaStreet && (
              <p className="text-[11px] text-error mt-1">{validationErrors.areaStreet}</p>
            )}
          </div>

          {/* Landmark */}
          <div>
            <label htmlFor="landmark" className="block text-xs font-bold text-foreground mb-1">
              Landmark <span className="text-foreground-muted font-normal">(Optional)</span>
            </label>
            <input
              id="landmark"
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near Apollo Hospital or Behind Bus Stop"
              className="w-full h-11 px-3.5 bg-surface border border-border rounded-xl text-xs font-medium text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-success transition-all"
            />
          </div>

          {/* Town / City & State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="townCity" className="block text-xs font-bold text-foreground mb-1">
                Town/City *
              </label>
              <input
                id="townCity"
                type="text"
                value={townCity}
                onChange={(e) => setTownCity(e.target.value)}
                placeholder="e.g. Ahmedabad"
                className={`w-full h-11 px-3.5 bg-surface border rounded-xl text-xs font-medium text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  validationErrors.townCity
                    ? 'border-error focus:ring-rose-500/20 focus:border-error'
                    : 'border-border focus:ring-emerald-500/20 focus:border-success'
                }`}
              />
              {validationErrors.townCity && (
                <p className="text-[11px] text-error mt-1">{validationErrors.townCity}</p>
              )}
            </div>

            <div>
              <label htmlFor="state" className="block text-xs font-bold text-foreground mb-1">
                State *
              </label>
              <SearchableCombobox
                id="state"
                value={state}
                onChange={(val) => setState(val)}
                options={stateOptions}
                placeholder="Select or enter state"
                error={validationErrors.state}
                allowCustom={true}
              />
              {validationErrors.state && (
                <p className="text-[11px] text-error mt-1">{validationErrors.state}</p>
              )}
            </div>
          </div>

          {/* Weekend Delivery Availability */}
          <div className="p-4 bg-surface-muted border border-border/80 rounded-2xl space-y-3">
            <div>
              <p className="text-xs font-bold text-foreground">Weekend Delivery Availability</p>
              <p className="text-[11px] text-foreground-muted mt-0.5 leading-relaxed">
                Indicate if you are available to receive packages on weekends. (Deliveries remain subject to store operating hours).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Saturday */}
              <div className="flex items-center justify-between bg-surface px-3.5 py-2.5 rounded-xl border border-border">
                <span className="text-xs font-medium text-foreground">Can receive on Saturdays?</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setSaturdayDelivery(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      !saturdayDelivery
                        ? 'bg-error-bg text-error border border-error/20'
                        : 'text-foreground-muted hover:bg-surface-muted'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaturdayDelivery(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      saturdayDelivery
                        ? 'bg-success-bg text-success border border-success/20'
                        : 'text-foreground-muted hover:bg-surface-muted'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {/* Sunday */}
              <div className="flex items-center justify-between bg-surface px-3.5 py-2.5 rounded-xl border border-border">
                <span className="text-xs font-medium text-foreground">Can receive on Sundays?</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setSundayDelivery(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      !sundayDelivery
                        ? 'bg-error-bg text-error border border-error/20'
                        : 'text-foreground-muted hover:bg-surface-muted'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setSundayDelivery(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      sundayDelivery
                        ? 'bg-success-bg text-success border border-success/20'
                        : 'text-foreground-muted hover:bg-surface-muted'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable: Additional Delivery Instructions */}
          <div className="border border-border rounded-2xl overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              aria-expanded={showInstructions}
              className="w-full flex items-center justify-between px-4 py-3 bg-surface-muted/70 hover:bg-surface-muted text-left text-xs font-bold text-foreground transition-colors"
            >
              <span>Do we need additional instructions to deliver to this address?</span>
              {showInstructions ? (
                <ChevronUp className="w-4 h-4 text-foreground-muted" />
              ) : (
                <ChevronDown className="w-4 h-4 text-foreground-muted" />
              )}
            </button>

            {showInstructions && (
              <div className="p-4 bg-surface border-t border-border space-y-2">
                <label htmlFor="deliveryInstructions" className="block text-xs font-semibold text-foreground-muted">
                  Delivery instructions
                </label>
                <textarea
                  id="deliveryInstructions"
                  rows={3}
                  maxLength={500}
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Provide details such as building description, a nearby landmark, security gate code, or other navigation instructions."
                  className="w-full p-3 bg-surface-muted border border-border rounded-xl text-xs font-medium text-foreground placeholder-slate-400 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-success transition-all resize-none"
                />
                <div className="flex justify-between text-[11px] text-foreground-muted">
                  <span>e.g. Leave package with guard, ring bell twice</span>
                  <span>{deliveryInstructions.length}/500</span>
                </div>
              </div>
            )}
          </div>

          {/* Default Address Checkbox */}
          <div className="flex items-center gap-3 pt-1">
            <input
              id="isDefaultAddress"
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-border text-success focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="isDefaultAddress" className="text-xs font-semibold text-foreground select-none cursor-pointer">
              Make this my default address
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-surface-muted font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-success hover:bg-success text-on-success font-semibold text-xs shadow-sm shadow-emerald-700/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditMode ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
