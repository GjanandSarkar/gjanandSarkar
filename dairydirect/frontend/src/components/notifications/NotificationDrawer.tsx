"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell, 
  Package, 
  CalendarDays, 
  Truck, 
  Info, 
  CheckCheck, 
  Loader2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { 
  getNotifications, 
  markAsRead, 
  markAllRead, 
  subscribeToNotifications 
} from '@/lib/api/notifications';
import type { DBNotification } from '@/lib/supabase';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  order: { icon: Package, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  subscription: { icon: CalendarDays, color: 'text-primary', bg: 'bg-primary/10' },
  delivery: { icon: Truck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  system: { icon: Info, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
};

export function NotificationDrawer() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const isOpen = useStore((s) => s.isNotificationDrawerOpen);
  const setIsOpen = useStore((s) => s.setNotificationDrawerOpen);

  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMedia = () => setIsDesktop(window.innerWidth >= 768);
    updateMedia();
    window.addEventListener('resize', updateMedia);
    return () => window.removeEventListener('resize', updateMedia);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    const data = await getNotifications(user.id, user.role);
    setNotifications(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotifications(user.id, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });
    return unsubscribe;
  }, [user]);

  // Escape key & body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notif: DBNotification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    setIsOpen(false);
    if (notif.related_id) {
      const path =
        notif.type === 'order'
          ? `/tracking/${notif.related_id}`
          : notif.type === 'subscription'
          ? `/subscribe`
          : null;
      if (path) router.push(path);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user || markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    await markAllRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setMarkingAll(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="notification-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Panel: Sidebar on Desktop, Bottom Drawer on Mobile */}
          <motion.div
            key="notification-panel"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-title"
            initial={isDesktop ? { x: '100%', y: 0 } : { y: '100%', x: 0 }}
            animate={{ x: 0, y: 0 }}
            exit={isDesktop ? { x: '100%', y: 0 } : { y: '100%', x: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed z-[60] bottom-0 left-0 right-0 max-h-[86vh] h-[86vh] bg-surface rounded-t-3xl md:top-0 md:bottom-0 md:left-auto md:right-0 md:h-full md:max-h-full md:w-[420px] md:rounded-none flex flex-col shadow-2xl border-t md:border-t-0 md:border-l border-border text-foreground"
          >
            {/* Mobile drag handle */}
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mt-2.5 mb-1 md:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="notification-title" className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">
                      Notifications
                    </h2>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-foreground-muted">Stay updated on your orders & deliveries</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={markingAll}
                    className="text-xs font-bold text-primary hover:text-primary-hover transition-colors px-2 py-1 rounded-lg hover:bg-surface-muted cursor-pointer flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-muted text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-border/50">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-foreground-muted">
                  <Loader2 className="w-7 h-7 animate-spin text-primary mb-2" />
                  <p className="text-xs font-medium">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center px-4 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center text-foreground-muted border border-border">
                    <Bell className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">All caught up!</h3>
                    <p className="text-xs text-foreground-muted max-w-[240px] mt-1 leading-relaxed">
                      You have no new notifications. We&apos;ll notify you when your deliveries and orders are updated.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => {
                  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                  const Icon = config.icon;

                  return (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer flex items-start gap-3 my-1 ${
                        notif.is_read
                          ? 'hover:bg-surface-muted/60 opacity-80'
                          : 'bg-primary/5 hover:bg-primary/10 border border-primary/20 shadow-2xs opacity-100'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>

                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <h4 className={`text-xs sm:text-sm font-bold truncate ${notif.is_read ? 'text-foreground' : 'text-primary'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[10px] text-foreground-muted shrink-0 tabular-nums">
                            {timeAgo(notif.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border/70 text-center bg-surface-muted/30">
              <span className="text-[11px] text-foreground-muted inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>Real-time delivery & fresh stock alerts</span>
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
