"use client";

import { useState, useEffect } from 'react';
import { Camera, Check, Edit2, Loader2, LogOut, User, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { updateProfileName, updateProfileAvatar, updateProfilePhone } from '@/lib/api/auth';
import type { User as StoreUser } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileSummaryProps {
  user: StoreUser | null;
  onUpdateProfile: (updates: Partial<StoreUser>) => void;
  onLogout: () => void;
}

export function ProfileSummary({ user, onUpdateProfile, onLogout }: ProfileSummaryProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derive initial first and last name from user profile
  const initNames = () => {
    let fn = '';
    let ln = '';
    if (user?.first_name && !/\d/.test(user.first_name)) {
      fn = user.first_name;
    }
    if (user?.last_name && !/\d/.test(user.last_name)) {
      ln = user.last_name;
    }
    if ((!fn || !ln) && user?.name && !/\d/.test(user.name)) {
      const parts = user.name.trim().split(/\s+/);
      if (!fn) fn = parts[0] || '';
      if (!ln) ln = parts.slice(1).join(' ') || '';
    }
    setFirstName(fn);
    setLastName(ln);
  };

  useEffect(() => {
    if (!isEditing) {
      initNames();
    }
    if (user?.phone && !isEditingPhone) {
      setProfilePhone(user.phone);
    }
  }, [user?.name, user?.first_name, user?.last_name, user?.phone, isEditing, isEditingPhone]);

  const hasNumbersInName = /\d/.test(firstName) || /\d/.test(lastName);
  const autoFullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const handleUpdate = async () => {
    if (!user) return;

    if (hasNumbersInName) {
      setErrorMsg("Name cannot contain numbers.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Please enter both First Name and Last Name.");
      return;
    }
    
    // Save previous state for rollback
    const previousState = {
      first_name: user.first_name,
      last_name: user.last_name,
      name: user.name,
    };
    
    // Optimistic Update
    onUpdateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      name: autoFullName,
    });
    setIsEditing(false);
    setErrorMsg(null);

    // Persist to DB
    const { updateProfileNames } = await import('@/lib/api/auth');
    const result = await updateProfileNames(user.id, firstName.trim(), lastName.trim());
    
    if (!result.success) {
      // Rollback on failure
      onUpdateProfile(previousState);
      initNames();
      setErrorMsg(result.error || "Failed to update name. Please try again.");
    }
  };

  const handleUpdatePhone = async () => {
    const rawPhone = profilePhone.trim().replace(/\D/g, '');
    if (!/^[6-9][0-9]{9}$/.test(rawPhone)) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!user) return;
    
    const previousPhone = user.phone;
    const newPhone = rawPhone;
    
    onUpdateProfile({ phone: newPhone });
    setIsEditingPhone(false);
    setErrorMsg(null);

    const result = await updateProfilePhone(user.id, newPhone);
    
    if (!result.success) {
      onUpdateProfile({ phone: previousPhone });
      setProfilePhone(previousPhone || '');
      setErrorMsg(result.error || "Please enter a valid 10-digit mobile number.");
    }
  };

  const handleAvatarUpload = async () => {
    if (!user) return;
    setIsUploading(true);
    setErrorMsg(null);
    
    const mockAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop'
    ];
    const newAvatar = mockAvatars[Math.floor(Math.random() * mockAvatars.length)];
    
    // Save previous state for rollback
    const previousAvatar = user.avatar_url;
    
    // Optimistic Update
    onUpdateProfile({ avatar_url: newAvatar });
    setIsUploading(false); // Can stop loading spinner now since UI is updated
    
    // Persist to DB
    const result = await updateProfileAvatar(user.id, newAvatar);
    
    if (!result.success) {
      // Rollback on failure
      onUpdateProfile({ avatar_url: previousAvatar });
      setErrorMsg("Failed to update profile picture.");
    }
  };

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-sand/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-[0.03] bg-primary pointer-events-none" />

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 relative z-10">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      <div className="flex items-center gap-4 relative z-10">
        {/* Avatar */}
        <div className="relative group shrink-0">
          <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-sand/30 border border-sand flex items-center justify-center relative">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt="Profile" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <User className="w-8 h-8 text-primary/40" />
            )}
          </div>
          <button
            onClick={handleAvatarUpload}
            disabled={isUploading}
            className="absolute bottom-0 right-0 bg-white border border-sand w-7 h-7 rounded-full flex items-center justify-center shadow-sm text-primary hover:bg-cream transition-colors active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-2 mb-2 w-full"
              >
                <div className="flex items-end gap-2">
                  <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
                    <div>
                      <label className="block text-[10px] font-bold text-muted uppercase mb-0.5">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setErrorMsg(null);
                        }}
                        placeholder="First Name"
                        className="bg-sand/30 text-dark font-bold text-sm rounded-xl px-2.5 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted/50"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted uppercase mb-0.5">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setErrorMsg(null);
                        }}
                        placeholder="Last Name"
                        className="bg-sand/30 text-dark font-bold text-sm rounded-xl px-2.5 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted/50"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 pb-0.5">
                    <button
                      onClick={handleUpdate}
                      disabled={hasNumbersInName || !firstName.trim() || !lastName.trim()}
                      className="bg-primary text-white w-8 h-8 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-primary/90 transition-colors cursor-pointer"
                      title="Save name"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        initNames();
                        setErrorMsg(null);
                      }}
                      className="bg-sand/40 text-dark w-8 h-8 rounded-xl flex items-center justify-center shrink-0 hover:bg-sand/60 transition-colors cursor-pointer text-xs font-bold"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {hasNumbersInName && (
                  <p className="text-[11px] font-medium text-red-600">
                    Name cannot contain numbers.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 mb-1"
              >
                <h2 className="text-xl font-black text-dark truncate">
                  {user?.name || t('name')}
                </h2>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    initNames();
                  }}
                  className="text-muted hover:text-primary transition-colors p-1 cursor-pointer"
                  aria-label="Edit name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2 mt-1">
            <AnimatePresence mode="wait">
              {isEditingPhone ? (
                <motion.div
                  key="editPhone"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 flex-1"
                >
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="0000000000"
                    maxLength={10}
                    className="bg-sand/30 text-muted font-medium text-sm rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdatePhone}
                    disabled={!profilePhone.trim()}
                    className="bg-primary text-white w-7 h-7 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="viewPhone"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 flex-1"
                >
                  <p className="text-muted text-sm font-medium">
                    {user?.phone || '+91 -'}
                  </p>
                  <button
                    onClick={() => {
                      setIsEditingPhone(true);
                      setProfilePhone(user?.phone || '');
                    }}
                    className="text-muted/50 hover:text-primary transition-colors p-1"
                    aria-label="Edit phone"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {user?.role === 'admin' && (
              <span className="bg-dark text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-md tracking-wider shrink-0">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-sand/50">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-sm font-bold text-red-600/80 hover:text-red-700 transition-colors w-full p-2 rounded-xl hover:bg-red-50/50"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
