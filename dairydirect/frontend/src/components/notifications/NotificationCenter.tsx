"use client";

import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationItem, type NotificationData } from './NotificationItem';
import { NotificationEmptyState } from './NotificationEmptyState';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

// Dummy data for visual preview. In real app, fetch from backend.
const DUMMY_NOTIFICATIONS: NotificationData[] = [
  { id: '1', type: 'delivery', title: 'Out for Delivery', message: 'Your morning milk delivery is on the way and will reach you by 6:30 AM.', isRead: false, time: 'Just now' },
  { id: '2', type: 'offer', title: 'Unlock Free Ghee!', message: 'Add 2 items to your upcoming subscription delivery to unlock a free sample of A2 Ghee.', isRead: false, time: '2h ago' },
  { id: '3', type: 'order', title: 'Subscription Paused', message: 'Your delivery for tomorrow has been successfully paused.', isRead: true, time: 'Yesterday' },
];

export function NotificationCenter({ isOpen, onClose, isMobile = false }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>(DUMMY_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    // Optional: navigate based on notification type
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

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-surface md:hidden"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Desktop Drawer Slide-over
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 hidden md:block"
          />
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
