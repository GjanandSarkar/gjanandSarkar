"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { updateProfileName, logout as supabaseLogout } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import {
  ChevronRight, Settings, MapPin, Bell, Receipt,
  RefreshCw, HeartHandshake, HelpCircle, FileText,
  LogOut, Globe, AlertTriangle, Leaf, Loader2, Camera, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Language } from '@/store/useStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const user = useStore((s) => s.user);
  const logoutLocal = useStore((s) => s.logout);
  const setLanguage = useStore((s) => s.setLanguage);
  const updateProfileLocal = useStore((s) => s.updateProfile);

  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [profileName, setProfileName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabaseLogout();
    logoutLocal();
    router.replace('/login');
  };

  const handleUpdateProfile = async () => {
    if (!profileName.trim() || !user) return;
    setIsUpdating(true);
    const result = await updateProfileName(user.id, profileName.trim());
    if (result.success) {
      updateProfileLocal({ name: profileName.trim(), avatar_url: avatarUrl });
    }
    setIsUpdating(false);
    setShowEditProfile(false);
  };

  const handleAvatarUpload = () => {
    setIsUploading(true);
    // Simulation: in a real app, this would open a file picker and upload to Supabase Storage
    setTimeout(() => {
      const mockAvatars = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop'
      ];
      const newAvatar = mockAvatars[Math.floor(Math.random() * mockAvatars.length)];
      setAvatarUrl(newAvatar);
      setIsUploading(false);
    }, 1500);
  };

  const sections = [
    {
      title: t('account'),
      items: [
        { icon: Globe, label: t('languageSettings'), onClick: () => setShowLanguageSettings(true) },
        { icon: MapPin, label: t('savedAddresses'), onClick: () => router.push('/profile/saved-addresses') },
        { icon: Bell, label: t('notificationPrefs'), badge: t('soon'), onClick: () => {} },
      ],
    },
    {
      title: t('ordersSubs'),
      items: [
        { icon: Receipt, label: t('myOrders'), onClick: () => router.push('/orders') },
        { icon: RefreshCw, label: t('mySubscriptions'), onClick: () => router.push('/subscribe') },
        { icon: HeartHandshake, label: t('qualityReports'), onClick: () => router.push('/profile/quality-reports') },
      ],
    },
    {
      title: t('supportLegal'),
      items: [
        { icon: HelpCircle, label: t('helpCentre'), badge: t('soon'), onClick: () => {} },
        { icon: FileText, label: t('termsPolicy'), badge: t('soon'), onClick: () => {} },
      ],
    },
  ];

  return (
    <>
      <div className="flex flex-col min-h-screen pb-24 relative" style={{ background: 'var(--color-surface)' }}>
        {/* Hero */}
        <div className="px-6 pt-10 pb-8 border-b text-center relative overflow-hidden"
          style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'rgba(195,201,187,0.3)' }}>
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-30"
            style={{ background: 'var(--color-primary-fixed)' }} />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-20"
            style={{ background: 'var(--color-tertiary-fixed)' }} />

          <div className="relative z-10">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-full h-full rounded-full flex items-center justify-center font-black text-4xl shadow-md border-4 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-fixed), var(--color-tertiary-fixed))',
                  color: 'var(--color-primary)',
                  borderColor: 'white',
                }}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || <User className="w-12 h-12" />
                )}
              </div>
              <button 
                onClick={handleAvatarUpload}
                disabled={isUploading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white active:scale-90 transition-all"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </div>
            <h1 className="text-[24px] font-black tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
              {user?.name || 'Welcome!'}
            </h1>
            <p className="text-sm font-bold mt-1 tracking-wider" style={{ color: 'var(--color-outline)' }}>
              +91 {user?.phone || '—'}
            </p>
            {user?.role === 'admin' && (
              <span className="mt-2 inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-primary)' }}>
                Admin
              </span>
            )}
            <button
              onClick={() => setShowEditProfile(true)}
              className="mt-5 text-[11px] font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all active:scale-95"
              style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-primary)' }}>
              {t('editProfile')}
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="p-4 flex-1">
          {sections.map((section, idx) => (
            <div key={idx} className="mb-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 ml-4"
                style={{ color: 'var(--color-outline)' }}>
                {section.title}
              </h2>
              <div className="rounded-[24px] overflow-hidden shadow-sm"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <div key={itemIdx}>
                      <button
                        onClick={item.onClick}
                        className="w-full flex items-center justify-between p-5 transition-colors group"
                        style={{ background: 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-container-low)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-[14px] flex items-center justify-center transition-colors"
                            style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}>
                            <Icon className="w-5 h-5" strokeWidth={2.2} />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-bold text-[15px]" style={{ color: 'var(--color-on-surface)' }}>
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="text-[8px] font-black uppercase tracking-widest"
                                style={{ color: 'var(--color-primary)' }}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-outline)' }} />
                      </button>
                      {itemIdx < section.items.length - 1 && (
                        <div className="h-px ml-20 opacity-40" style={{ background: 'var(--color-outline-variant)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="full"
            className="w-full h-14 mt-4 font-bold rounded-[18px]"
            style={{ color: '#ef4444', borderColor: '#fecaca', background: 'transparent' }}
            onClick={() => setShowLogoutConfirm(true)}>
            <LogOut className="w-5 h-5 mr-3" />
            {t('logoutAccount')}
          </Button>

          <div className="text-center mt-12 mb-6">
            <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-outline)' }}>Gjanand Sarkar v2.0.0</p>
            <p className="text-xs flex items-center justify-center gap-1" style={{ color: 'var(--color-outline)' }}>
              Made with <Leaf className="w-3 h-3" style={{ color: 'var(--color-primary)' }} /> in Ahmedabad
            </p>
          </div>
        </div>
      </div>

      {/* ── Language Sheet ── */}
      <AnimatePresence>
        {showLanguageSettings && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowLanguageSettings(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 rounded-t-[20px] z-[60] p-6 max-w-[430px] mx-auto"
              style={{ background: 'var(--color-surface)' }}>
              <div className="w-12 h-1.5 rounded-full mx-auto mb-6" style={{ background: 'var(--color-outline-variant)' }} />
              <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--color-on-surface)' }}>
                {t('languageSettings')}
              </h2>
              <div className="space-y-3 mb-8">
                {([
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिंदी (Hindi)' },
                  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
                ] as { code: Language; label: string }[]).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setTimeout(() => setShowLanguageSettings(false), 200); }}
                    className="w-full flex items-center justify-between p-4 rounded-[12px] border font-bold transition-all"
                    style={language === lang.code ? {
                      borderColor: 'var(--color-primary)',
                      background: 'var(--color-primary-fixed)',
                      color: 'var(--color-primary)',
                    } : {
                      borderColor: 'var(--color-outline-variant)',
                      background: 'var(--color-surface-container-lowest)',
                      color: 'var(--color-on-surface)',
                    }}>
                    {lang.label}
                    {language === lang.code && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Edit Profile Sheet ── */}
      <AnimatePresence>
        {showEditProfile && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowEditProfile(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 rounded-t-[24px] z-[60] p-6 max-w-[430px] mx-auto"
              style={{ background: 'var(--color-surface)' }}>
              <div className="w-12 h-1.5 rounded-full mx-auto mb-6" style={{ background: 'var(--color-outline-variant)' }} />
              <h2 className="text-xl font-black mb-6" style={{ color: 'var(--color-on-surface)' }}>
                {t('editProfile')}
              </h2>
              <div className="space-y-6 mb-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] mb-2 block ml-1"
                    style={{ color: 'var(--color-outline)' }}>{t('fullName')}</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full h-14 rounded-[16px] px-5 font-bold outline-none transition-all"
                    style={{
                      background: 'var(--color-surface-container)',
                      color: 'var(--color-on-surface)',
                      border: '1px solid var(--color-outline-variant)',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--color-outline-variant)'; }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] mb-2 block ml-1"
                    style={{ color: 'var(--color-outline)' }}>{t('phoneNumber')}</label>
                  <div className="w-full h-14 rounded-[16px] px-5 flex items-center font-bold opacity-70"
                    style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface-variant)' }}>
                    +91 {user?.phone}
                    <span className="ml-auto text-[9px] font-black uppercase tracking-widest">{t('verified')}</span>
                  </div>
                  <p className="text-[10px] mt-2 ml-1" style={{ color: 'var(--color-outline)' }}>
                    Phone number cannot be changed for security reasons.
                  </p>
                </div>
              </div>
              <Button
                size="full"
                className="h-14 rounded-[18px] font-black text-sm tracking-wide"
                onClick={handleUpdateProfile}
                disabled={isUpdating || !profileName.trim()}>
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : t('saveDetails')}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Logout Confirm ── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}>
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-[320px] rounded-[20px] p-6 flex flex-col items-center text-center shadow-xl"
              style={{ background: 'var(--color-surface)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: '#fef2f2' }}>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-on-surface)' }}>
                {t('logoutConfirm')}
              </h2>
              <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--color-outline)' }}>
                {t('logoutConfirmSub')}
              </p>
              <div className="flex flex-col w-full gap-3">
                <Button
                  className="w-full h-12 rounded-xl font-bold"
                  style={{ background: '#ef4444', color: 'white' }}
                  onClick={handleLogout}
                  disabled={isLoggingOut}>
                  {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : t('yesLogout')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl font-bold border-sand"
                  onClick={() => setShowLogoutConfirm(false)}>
                  {t('cancel')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
