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
import { Bell, X, Package, CalendarDays, Info, Truck, AlertTriangle, Tag, RotateCcw } from 'lucide-react';
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

const TYPE_ICON: Record<string, any> = {
  order: Package,
  subscription: CalendarDays,
  delivery: Truck,
  system: Info,
  alert: AlertTriangle,
  promo: Tag,
  return: RotateCcw,
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
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors bg-surface-muted text-foreground hover:bg-border cursor-pointer min-h-[44px] min-w-[44px]"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-foreground" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 text-xs font-semibold rounded-full flex items-center justify-center bg-primary text-on-primary">
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
                className="fixed inset-0 bg-black/40 z-50"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.18 }}
                className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-xl overflow-hidden bg-surface border-t border-border max-h-[80vh]"
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
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 right-0 z-50 w-[340px] rounded-xl overflow-hidden shadow-lg bg-surface border border-border"
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
    <div className="flex flex-col max-h-[75vh]">
      {/* Handle (mobile) */}
      <div className="w-12 h-1.5 rounded-full mx-auto mt-3 mb-1 bg-border" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="font-semibold text-base text-foreground">
            {t('notifications')}
          </h2>
          {unreadCount > 0 && (
            <p className="text-xs text-foreground-muted mt-0.5">
              {unreadCount} unread
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-muted text-primary hover:bg-border transition-colors cursor-pointer"
            >
              {t('markAllRead')}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-muted text-foreground hover:bg-border transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 pb-6 divide-y divide-border">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <Bell className="w-10 h-10 mb-3 text-foreground-muted" strokeWidth={1.5} />
            <p className="font-medium text-sm text-foreground">
              {t('noNotifications')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((notif) => {
              const Icon = TYPE_ICON[notif.type ?? 'system'] ?? Info;
              return (
                <button
                  key={notif.id}
                  onClick={() => onNotificationClick(notif)}
                  className={`flex items-start gap-3 px-5 py-3.5 text-left transition-colors cursor-pointer ${
                    notif.is_read ? 'bg-surface hover:bg-surface-muted' : 'bg-surface-muted hover:bg-border'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-surface text-primary border border-border">
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-foreground leading-tight">
                      {notif.title}
                    </p>
                    <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-xs mt-1 text-foreground-muted font-normal">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1.5 bg-primary" />
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
