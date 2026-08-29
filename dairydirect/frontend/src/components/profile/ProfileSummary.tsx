"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Check, 
  Loader2, 
  User, 
  AlertCircle, 
  X, 
  Calendar, 
  MapPin, 
  Pencil,
  Mail,
  Phone,
  ChevronDown,
  Upload
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { updateProfileName, updateProfileAvatar, updateProfilePhone } from '@/lib/api/auth';
import { uploadImageToImageKit } from '@/lib/api/imagekit';
import type { User as StoreUser } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPhoneInput, validatePhoneNumber } from '@/lib/utils/phone';

interface ProfileSummaryProps {
  user: StoreUser | null;
  onUpdateProfile: (updates: Partial<StoreUser>) => void;
}

interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  maxLength: number;
}

const COUNTRY_LIST: CountryOption[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', maxLength: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', maxLength: 10 },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', maxLength: 9 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', maxLength: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', maxLength: 9 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', maxLength: 11 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', maxLength: 8 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', maxLength: 9 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', maxLength: 9 },
];

export function ProfileSummary({ user, onUpdateProfile }: ProfileSummaryProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [rawPhoneDigits, setRawPhoneDigits] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRY_LIST[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      if (user?.first_name || user?.last_name) {
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
      } else if (user?.name) {
        const parts = user.name.trim().split(/\s+/);
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
    }
  }, [user?.first_name, user?.last_name, user?.name, isEditing]);

  useEffect(() => {
    if (user?.phone) {
      const digits = user.phone.replace(/^\+91/, '').replace(/\D/g, '').slice(0, 10);
      setRawPhoneDigits(digits);
    }
  }, [user?.phone]);

  useEffect(() => {
    if (user?.email) {
      setProfileEmail(user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.country) {
      const matched = COUNTRY_LIST.find(c => c.name.toLowerCase() === user.country?.toLowerCase() || c.code.toLowerCase() === user.country?.toLowerCase());
      if (matched) setSelectedCountry(matched);
    }
  }, [user?.country]);

  const handleUpdateAll = async () => {
    const fName = firstName.trim();
    const lName = lastName.trim();
    const combinedName = `${fName} ${lName}`.trim();
    if (!combinedName || !user) return;

    const fullPhone = `${selectedCountry.dialCode}${rawPhoneDigits}`;
    if (rawPhoneDigits.trim() && selectedCountry.code === 'IN') {
      const validRes = validatePhoneNumber(fullPhone);
      if (!validRes.isValid) {
        setErrorMsg("Enter a valid Indian mobile number");
        return;
      }
    }
    
    // Save previous state for rollback
    const previousName = user.name;
    const previousFirstName = user.first_name || '';
    const previousLastName = user.last_name || '';
    const previousPhone = user.phone;
    const previousCountry = user.country;
    
    const phoneToSave = rawPhoneDigits.trim() ? rawPhoneDigits.trim() : (user.phone ? user.phone.replace(/^\+91/, '').replace(/\D/g, '') : '');

    // Optimistic Update
    onUpdateProfile({
      first_name: fName,
      last_name: lName,
      name: combinedName,
      phone: phoneToSave,
      email: profileEmail.trim() || user.email,
      country: selectedCountry.name,
    });
    setIsEditing(false);
    setErrorMsg(null);

    // Persist to DB via API
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: fName,
          last_name: lName,
          name: combinedName,
          phone: phoneToSave,
          email: profileEmail.trim() || user.email,
          country: selectedCountry.name,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save profile');
      }
    } catch (err: any) {
      // Rollback on failure
      onUpdateProfile({
        name: previousName,
        first_name: previousFirstName,
        last_name: previousLastName,
        phone: previousPhone,
        country: previousCountry,
      });
      setFirstName(previousFirstName);
      setLastName(previousLastName);
      if (previousPhone) {
        setRawPhoneDigits(previousPhone.replace(/^\+91/, '').replace(/\D/g, '').slice(0, 10));
      }
      setErrorMsg(err.message || "Failed to update profile details. Please try again.");
    }
  };

  const handleSelectPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image file size must be less than 5MB.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    const previousAvatar = user.avatar_url;

    try {
      // 1. Upload to ImageKit
      const uploadRes = await uploadImageToImageKit(file, 'profiles');

      if (!uploadRes.success || !uploadRes.url) {
        setErrorMsg(uploadRes.error || "Failed to upload image to ImageKit.");
        return;
      }

      // 2. Optimistically update local user state with ImageKit URL
      const imageKitUrl = uploadRes.url;
      onUpdateProfile({ avatar_url: imageKitUrl });

      // 3. Save ImageKit URL to backend database & profile
      const result = await updateProfileAvatar(user.id, imageKitUrl);
      if (!result.success) {
        onUpdateProfile({ avatar_url: previousAvatar });
        setErrorMsg(result.error || "Failed to save updated profile picture.");
      }
    } catch (err: any) {
      onUpdateProfile({ avatar_url: previousAvatar });
      setErrorMsg(err.message || "Failed to update profile picture.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-xs border border-gray-100 relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {errorMsg && (
        <div className="mb-6 flex items-center gap-2 p-3.5 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-100 relative z-10">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 relative z-10"
          >
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Profile</h3>
                <p className="text-sm font-medium text-gray-500 mt-0.5">Update your profile information</p>
              </div>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setErrorMsg(null);
                }}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content Grid: Photo Left, Inputs Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
              
              {/* Left Column: Profile Photo */}
              <div className="md:col-span-5 flex flex-col items-center text-center space-y-3 pb-4 md:pb-0">
                <div className="relative group shrink-0">
                  <div 
                    onClick={handleSelectPhotoClick}
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-sm flex items-center justify-center relative cursor-pointer group-hover:brightness-95 transition-all"
                  >
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    ) : (
                      <img 
                        src={user?.avatar_url || '/profile/profile.jpg'} 
                        alt="Profile Photo" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/profile/profile.jpg';
                        }}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectPhotoClick}
                    disabled={isUploading}
                    className="absolute bottom-1 right-1 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-700 shadow-xs hover:bg-gray-50 transition-colors active:scale-95 cursor-pointer"
                    title="Change photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-900">Profile Photo</h4>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">JPG, PNG or WebP. Max size 2MB.</p>
                </div>

                <button
                  type="button"
                  onClick={handleSelectPhotoClick}
                  disabled={isUploading}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-800 shadow-2xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5 text-gray-600" />
                  <span>Upload Photo</span>
                </button>
              </div>

              {/* Right Column: Form Inputs */}
              <div className="md:col-span-7 space-y-4">
                
                {/* First Name & Last Name Input Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First Name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 outline-none focus:border-gray-900 transition-all bg-white"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last Name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 outline-none focus:border-gray-900 transition-all bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="amul.sureja@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 outline-none focus:border-gray-900 transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Phone Number with Country Code Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <div className="flex relative">
                    {/* Country Code Pill */}
                    <button
                      type="button"
                      onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-r-0 border-gray-200 rounded-l-xl text-sm font-semibold text-gray-900 shrink-0 select-none hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-gray-900">{selectedCountry.code}</span>
                      <span className="text-gray-900 font-bold">{selectedCountry.dialCode}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Country Selection Dropdown */}
                    {isCountryDropdownOpen && (
                      <>
                        {/* Backdrop to close dropdown on click outside */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsCountryDropdownOpen(false)} 
                        />
                        <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100/90 p-2 z-50 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95">
                          <div className="space-y-0.5">
                            {COUNTRY_LIST.map((c) => {
                              const isSelected = selectedCountry.code === c.code;
                              return (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountry(c);
                                    setIsCountryDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-50/70 text-[#065f46] font-bold shadow-2xs'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="font-bold text-gray-900 text-xs w-5 shrink-0">{c.code}</span>
                                    <span className="truncate text-gray-900 text-xs font-medium">{c.name}</span>
                                    <span className="text-gray-400 text-[11px] font-normal shrink-0">({c.code})</span>
                                  </div>
                                  <span className="font-semibold text-gray-900 text-xs shrink-0 ml-2">{c.dialCode}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Phone Digits Input */}
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={rawPhoneDigits}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, selectedCountry.maxLength);
                          setRawPhoneDigits(digits);
                        }}
                        placeholder="98765 43210"
                        maxLength={selectedCountry.maxLength}
                        className="w-full pl-10 pr-4 py-2.5 rounded-r-xl border border-gray-200 text-sm font-medium text-gray-900 outline-none focus:border-gray-900 transition-all bg-white"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer Divider & Action Buttons */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setErrorMsg(null);
                }}
                className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateAll}
                disabled={
                  !firstName.trim() || 
                  (rawPhoneDigits.trim() !== '' && !validatePhoneNumber(`+91${rawPhoneDigits}`).isValid)
                }
                className="px-6 py-2.5 rounded-xl bg-[#0f172a] hover:bg-black text-white text-sm font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view-mode"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-5 relative z-10"
          >
            {/* Left Section: Avatar + Info */}
            <div className="flex items-center gap-5 w-full sm:w-auto">
              {/* Avatar Container */}
              <div 
                onClick={handleSelectPhotoClick}
                className="relative shrink-0 group cursor-pointer"
                title="Change photo"
              >
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-xs flex items-center justify-center relative group-hover:brightness-95 transition-all">
                  {isUploading ? (
                    <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  ) : (
                    <img 
                      src={user?.avatar_url || '/profile/profile.jpg'} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/profile/profile.jpg';
                      }}
                    />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-700 shadow-xs group-hover:scale-110 transition-transform">
                  <Camera className="w-3 h-3" />
                </div>
              </div>

              {/* User Identity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                    {user?.name || t('name')}
                  </h2>
                  {user?.role === 'admin' && (
                    <span className="bg-gray-900 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-md tracking-wider shrink-0 ml-1">
                      Admin
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-[#606f7b] truncate mb-2">
                  {user?.phone ? (() => {
                    const currentCountry = COUNTRY_LIST.find(c => 
                      c.name.toLowerCase() === user?.country?.toLowerCase() || 
                      c.code.toLowerCase() === user?.country?.toLowerCase()
                    ) || selectedCountry || COUNTRY_LIST[0];
                    const digits = user.phone.replace(/^\+\d+\s*/, '').replace(/\D/g, '');
                    return `${currentCountry.dialCode} ${digits}`;
                  })() : user?.email}
                </p>

                {/* Metadata Row: Joined + Location */}
                <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Joined May 2024</span>
                  </div>
                  <span className="w-px h-3 bg-gray-300/70" />
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{user?.country || selectedCountry?.name || 'India'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section: Action Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
              <button
                onClick={() => {
                  setIsEditing(true);
                  if (user?.first_name || user?.last_name) {
                    setFirstName(user.first_name || '');
                    setLastName(user.last_name || '');
                  } else if (user?.name) {
                    const parts = user.name.trim().split(/\s+/);
                    setFirstName(parts[0] || '');
                    setLastName(parts.slice(1).join(' ') || '');
                  }
                  if (user?.phone) {
                    setRawPhoneDigits(user.phone.replace(/^\+91/, '').replace(/\D/g, '').slice(0, 10));
                  }
                  if (user?.email) {
                    setProfileEmail(user.email);
                  }
                }}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 shadow-2xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-gray-600" />
                <span>Edit Profile</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
