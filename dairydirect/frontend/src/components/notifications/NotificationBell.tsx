"use client";

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { api } from '@/lib/api/client';
import dynamic from 'next/dynamic';

const NotificationCenter = dynamic(() => import('./NotificationCenter').then(mod => mod.NotificationCenter), {
  ssr: false,
});

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  /**
   * Was `const unreadCount = 2;` — a permanent phantom badge that no user
   * could ever clear, on every page of the site. Now reflects the real
   * unread count from /api/notifications.
   */
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.notifications.get();
        if (cancelled) return;
        const rows = Array.isArray(res?.notifications) ? res.notifications : [];
        setUnreadCount(
          rows.filter((n: Record<string, unknown>) => !(n.is_read ?? n.isRead)).length,
        );
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasOpened]);

  return (
    <>
      <button 
        onClick={() => {
          setIsOpen(true);
          setHasOpened(true);
        }}
        className="relative p-2 text-dark hover:bg-sand rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-3 w-3 items-center justify-center rounded-full text-[8px] font-bold text-white bg-red-500 border-2 border-white" />
        )}
      </button>

      {hasOpened && (
        <NotificationCenter 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
