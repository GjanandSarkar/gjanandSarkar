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
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-sand px-4 py-4 md:px-8">
        <div className="flex items-center justify-between max-w-[800px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} 
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-muted transition-colors min-h-[44px] min-w-[44px]">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('notifications')}</h1>
              {unreadCount > 0 && <p className="text-xs font-medium text-primary">{unreadCount} New Unread</p>}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-colors bg-surface-muted text-primary border border-border hover:bg-border min-h-[44px] cursor-pointer"
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
            <div className="w-10 h-10 rounded-full border-2 border-border border-t-primary animate-spin" />
            <p className="text-xs font-medium text-foreground-muted">Loading History...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-lg bg-surface-muted flex items-center justify-center mb-4 border border-border">
              <Bell className="w-8 h-8 text-foreground-muted" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">No notifications yet</h2>
            <p className="text-xs text-foreground-muted max-w-[260px] mx-auto">
              We will notify you here about your orders and verified partner updates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-foreground-muted ml-1 mb-2">Recent Notifications</h3>
            <div className="rounded-lg overflow-hidden border border-border bg-surface shadow-xs divide-y divide-border">
              {notifications.map((notif) => {
                const Icon = TYPE_ICON[notif.type ?? 'system'] ?? Info;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full flex items-start gap-3.5 px-5 py-4 text-left transition-colors cursor-pointer ${
                      notif.is_read ? 'hover:bg-surface-muted bg-surface' : 'bg-surface-muted hover:bg-border'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-surface text-primary border border-border">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-xs sm:text-sm truncate pr-4 text-foreground">
                          {notif.title}
                        </p>
                        <span className="text-xs text-foreground-muted shrink-0 whitespace-nowrap">
                          {timeAgo(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-foreground-muted line-clamp-2">
                        {notif.message}
                      </p>
                    </div>

                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full shrink-0 mt-2 bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="p-6 text-center">
               <p className="text-xs text-foreground-muted">You are all caught up</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
