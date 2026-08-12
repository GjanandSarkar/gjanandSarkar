"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { getNotifications, markAsRead, markAllRead } from '@/lib/api/notifications';
import { NotificationItem, type NotificationData } from './NotificationItem';
import { NotificationEmptyState } from './NotificationEmptyState';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Recent';
  try {
    const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return 'Recent';
  }
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const user = useStore((s) => s.user);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLiveNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getNotifications(user.id, (user.role as any) || 'customer');
      const mapped: NotificationData[] = (data || []).map((n: any) => ({
        id: n.id,
        type: n.type || 'order',
        title: n.title,
        message: n.body || n.message,
        isRead: Boolean(n.is_read),
        time: formatRelativeTime(n.created_at),
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchLiveNotifications();
    }
  }, [isOpen, fetchLiveNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (user?.id) {
      await markAllRead(user.id);
    }
  };

  const handleNotificationClick = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await markAsRead(id);
  };

  const content = (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sand bg-white z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-dark">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount} New
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer"
              title="Mark all as read"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 text-muted hover:bg-sand rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-500 font-medium">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-800 mx-auto mb-2" />
            <span>Loading notifications...</span>
          </div>
        ) : notifications.length > 0 ? (
          <div className="flex flex-col bg-white divide-y divide-gray-100">
            {notifications.map((notif) => (
              <NotificationItem 
                key={notif.id} 
                notification={notif} 
                onClick={() => handleNotificationClick(notif.id)} 
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-8">
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
            className="fixed inset-0 bg-black/20 backdrop-blur-xs z-50"
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
