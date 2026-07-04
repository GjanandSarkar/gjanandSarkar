"use client";

import { useState } from 'react';
import { Camera, Check, Edit2, Loader2, LogOut, User, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { updateProfileName, updateProfileAvatar } from '@/lib/api/auth';
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
  const [profileName, setProfileName] = useState(user?.name || '');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!profileName.trim() || !user) return;
    
    // Save previous state for rollback
    const previousName = user.name;
    const newName = profileName.trim();
    
    // Optimistic Update
    onUpdateProfile({ name: newName });
    setIsEditing(false);
    setErrorMsg(null);

    // Persist to DB
    const result = await updateProfileName(user.id, newName);
    
    if (!result.success) {
      // Rollback on failure
      onUpdateProfile({ name: previousName });
      setProfileName(previousName);
      setErrorMsg("Failed to update name. Please try again.");
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
              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
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
                className="flex items-center gap-2 mb-1"
              >
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder={t('name')}
                  className="bg-sand/30 text-dark font-bold text-lg rounded-xl px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted/50"
                  autoFocus
                />
                <button
                  onClick={handleUpdate}
                  disabled={!profileName.trim()}
                  className="bg-primary text-white w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
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
                    setProfileName(user?.name || '');
                  }}
                  className="text-muted hover:text-primary transition-colors p-1"
                  aria-label="Edit name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-muted text-sm font-medium flex items-center gap-2">
            {user?.phone || '+91 -'}
            {user?.role === 'admin' && (
              <span className="bg-dark text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-md tracking-wider">
                Admin
              </span>
            )}
          </p>
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
