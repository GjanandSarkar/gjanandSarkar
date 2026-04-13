"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import {
  getNotifications,
  markAsRead,
  markAllRead,
  subscribeToNotifications,
} from '@/lib/api/notifications';
import type { DBNotification } from '@/lib/supabase';
import { Bell, ArrowLeft, Package, CalendarDays, Info, Truck, CheckCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useStore((s) => s.user);

  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

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
      if (path) router.push(path);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user || markingAll) return;
    setMarkingAll(true);
    await markAllRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setMarkingAll(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-sand px-4 py-4 md:px-8">
        <div className="flex items-center justify-between max-w-[800px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} 
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
              <ArrowLeft className="w-6 h-6 text-dark" />
            </button>
            <div>
              <h1 className="text-xl font-black text-dark tracking-tight">{t('notifications')}</h1>
              {unreadCount > 0 && <p className="text-[11px] font-bold text-primary uppercase tracking-widest">{unreadCount} New Unread</p>}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95 bg-primary/10 text-primary border border-primary/20"
            >
              {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
              {t('markAllRead')}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-[800px] mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-sand border-t-primary animate-spin" />
            <p className="text-sm font-bold text-muted uppercase tracking-widest">Loading History...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-[32px] bg-surface-container flex items-center justify-center mb-6">
              <Bell className="w-10 h-10 text-muted" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-dark mb-2">No notifications yet</h2>
            <p className="text-sm text-muted max-w-[240px] mx-auto">
              We'll notify you here about your orders, subscriptions and farm updates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-2 mb-4">Recent Notifications</h3>
            <div className="rounded-[28px] overflow-hidden border border-sand bg-white shadow-sm">
              {notifications.map((notif, i) => {
                const Icon = TYPE_ICON[notif.type ?? 'system'] ?? Info;
                return (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="w-full flex items-start gap-4 px-6 py-5 text-left transition-all relative hover:bg-surface-container-low group"
                    style={{
                      background: notif.is_read ? 'transparent' : 'rgba(63, 101, 48, 0.04)',
                      borderBottom: i < notifications.length - 1 ? '1px solid rgba(195,201,187,0.3)' : 'none'
                    }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-active:scale-95"
                      style={{ background: 'var(--color-surface-container)', color: 'var(--color-primary)' }}>
                      <Icon className="w-6 h-6" strokeWidth={2.2} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-[15px] truncate pr-4 text-dark">
                          {notif.title}
                        </p>
                        <span className="text-[10px] font-bold text-muted shrink-0 whitespace-nowrap uppercase tracking-wider">
                          {timeAgo(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-[13px] leading-relaxed text-muted line-clamp-2">
                        {notif.body}
                      </p>
                    </div>

                    {!notif.is_read && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                         <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(63,101,48,0.4)]" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            <div className="p-8 text-center">
               <p className="text-[11px] font-bold text-muted uppercase tracking-widest italic">That's all for now 🐄</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
