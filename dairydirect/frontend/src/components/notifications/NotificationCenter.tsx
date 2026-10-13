"use client";

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationItem, type NotificationData } from './NotificationItem';
import { NotificationEmptyState } from './NotificationEmptyState';
import { api } from '@/lib/api/client';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Relative time label, e.g. "2h ago".
 */
function relativeTime(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  /**
   * These were three hardcoded DUMMY_NOTIFICATIONS shown to every visitor —
   * "Your morning milk delivery is on the way", "unlock a free sample of A2
   * Ghee" — regardless of whether they had ever ordered anything. A real
   * `/api/notifications` endpoint and a NotificationEmptyState component both
   * already existed; the component simply was not wired to them.
   */
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const res = await api.notifications.get();
        if (cancelled) return;
        const rows = Array.isArray(res?.notifications) ? res.notifications : [];
        setNotifications(
          rows.map((n: Record<string, unknown>) => ({
            id: String(n.id ?? ''),
            type: (n.type as NotificationData['type']) ?? 'order',
            title: String(n.title ?? ''),
            message: String(n.message ?? ''),
            isRead: Boolean(n.is_read ?? n.isRead ?? false),
            time: relativeTime(
              (n.created_at as string) ?? (n.createdAt as string) ?? null,
            ),
          })),
        );
      } catch {
        // Endpoint unreachable: show the empty state rather than invented rows.
        if (!cancelled) setNotifications([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    void api.notifications.markRead(undefined, true).catch(() => {});
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    void api.notifications.markRead(id).catch(() => {});
  };

  const content = (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sand bg-white z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-dark">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} New
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
              title="Mark all as read"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 text-muted hover:bg-sand rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="flex flex-col bg-white">
            {notifications.map((notif) => (
              <NotificationItem 
                key={notif.id} 
                notification={notif} 
                onClick={() => handleNotificationClick(notif.id)} 
              />
            ))}
          </div>
        ) : (
          <div className="px-4">
            <NotificationEmptyState />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (shared) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />

          {/* Mobile Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 top-[10%] md:hidden z-50 rounded-t-3xl overflow-hidden shadow-2xl"
          >
            {content}
          </motion.div>

          {/* Desktop Right Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[400px] bg-surface z-50 shadow-2xl hidden md:block overflow-hidden"
          >
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
