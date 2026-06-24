"use client";

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import {
  getNotifications,
  markAsRead,
  markAllRead,
  subscribeToNotifications,
} from '@/lib/api/notifications';
import type { DBNotification } from '@/lib/supabase';
import { Bell, X, Package, CalendarDays, Info, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICON = {
  order: Package,
  subscription: CalendarDays,
  delivery: Truck,
  system: Info,
};

interface NotificationPanelProps {
  /** 'mobile' = bottom sheet, 'desktop' = dropdown */
  variant?: 'mobile' | 'desktop';
}

export function NotificationBell({ variant = 'mobile' }: NotificationPanelProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useStore((s) => s.user);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getNotifications(user.id, user.role);
    setNotifications(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadNotifications();

    // Realtime subscription
    const unsubscribe = subscribeToNotifications(user.id, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return unsubscribe;
  }, [user, loadNotifications]);

  const handleNotificationClick = async (notif: DBNotification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    if (notif.related_id) {
      const path = notif.type === 'order'
        ? `/tracking/${notif.related_id}`
        : notif.type === 'subscription'
        ? `/subscribe`
        : null;
      if (path) {
        setOpen(false);
        router.push(path);
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  if (!user) return null;

  return (
    <>
      {/* Bell Button */}
      <button
        id="notification-bell"
        onClick={() => router.push('/notifications')}
        className="relative w-9 h-9 rounded-[10px] flex items-center justify-center transition-all active:scale-95"
        style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface-variant)' }}
        aria-label="Notifications"
      >
        <Bell className="w-4.5 h-4.5" strokeWidth={2} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] text-[9px] font-bold rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-error)', color: 'white' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── MOBILE: Bottom Sheet ── */}
      {variant === 'mobile' && (
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-[24px] overflow-hidden"
                style={{ background: 'var(--color-surface)', maxHeight: '80vh' }}
              >
                <NotificationSheet
                  notifications={notifications}
                  loading={loading}
                  unreadCount={unreadCount}
                  onClose={() => setOpen(false)}
                  onMarkAllRead={handleMarkAllRead}
                  onNotificationClick={handleNotificationClick}
                  t={t}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* ── DESKTOP: Dropdown ── */}
      {variant === 'desktop' && (
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="absolute top-12 right-0 z-50 w-[340px] rounded-[20px] overflow-hidden shadow-2xl"
                style={{ background: 'var(--color-surface)' }}
              >
                <NotificationSheet
                  notifications={notifications}
                  loading={loading}
                  unreadCount={unreadCount}
                  onClose={() => setOpen(false)}
                  onMarkAllRead={handleMarkAllRead}
                  onNotificationClick={handleNotificationClick}
                  t={t}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared content for both bottom sheet & dropdown
// ─────────────────────────────────────────────────────────────
function NotificationSheet({
  notifications,
  loading,
  unreadCount,
  onClose,
  onMarkAllRead,
  onNotificationClick,
  t,
}: {
  notifications: DBNotification[];
  loading: boolean;
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead: () => void;
  onNotificationClick: (n: DBNotification) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col" style={{ maxHeight: '75vh' }}>
      {/* Handle (mobile) */}
      <div className="w-12 h-1.5 rounded-full mx-auto mt-3 mb-1"
        style={{ background: 'var(--color-outline-variant)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="font-extrabold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>
            {t('notifications')}
          </h2>
          {unreadCount > 0 && (
            <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--color-outline)' }}>
              {unreadCount} unread
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all"
              style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-primary)' }}
            >
              {t('markAllRead')}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface-variant)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-5" style={{ background: 'var(--color-outline-variant)', opacity: 0.3 }} />

      {/* List */}
      <div className="overflow-y-auto flex-1 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <Bell className="w-10 h-10 mb-4" style={{ color: 'var(--color-outline)' }} strokeWidth={1.5} />
            <p className="font-semibold text-[15px]" style={{ color: 'var(--color-on-surface)' }}>
              {t('noNotifications')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((notif, i) => {
              const Icon = TYPE_ICON[notif.type ?? 'system'] ?? Info;
              return (
                <button
                  key={notif.id}
                  onClick={() => onNotificationClick(notif)}
                  className="flex items-start gap-3.5 px-5 py-4 text-left transition-all hover:brightness-95 active:scale-[0.99]"
                  style={{
                    background: notif.is_read ? 'transparent' : 'var(--color-primary-fixed)',
                    borderTop: i > 0 ? '1px solid rgba(195,201,187,0.2)' : undefined,
                  }}
                >
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-primary)' }}>
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] leading-tight"
                      style={{ color: 'var(--color-on-surface)' }}>
                      {notif.title}
                    </p>
                    <p className="text-[12px] mt-0.5 leading-relaxed"
                      style={{ color: 'var(--color-on-surface-variant)' }}>
                      {notif.message}
                    </p>
                    <p className="text-[10px] mt-1.5 font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--color-outline)' }}>
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                      style={{ background: 'var(--color-primary)' }} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
