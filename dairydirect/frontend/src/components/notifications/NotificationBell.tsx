"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getUnreadCount } from '@/lib/api/notifications';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const NotificationCenter = dynamic(() => import('./NotificationCenter').then(mod => mod.NotificationCenter), {
  ssr: false,
});

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useStore((s) => s.user);

  const fetchUnread = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }
    const count = await getUnreadCount(user.id, (user.role as any) || 'customer');
    setUnreadCount(count);
  }, [user]);

  useEffect(() => {
    fetchUnread();

    // Supabase Realtime subscription for instant badge updates
    if (user?.id) {
      const channel = supabase
        .channel(`notif_bell_${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          () => {
            fetchUnread();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchUnread, user]);

  return (
    <>
      <button 
        onClick={() => {
          setIsOpen(true);
          setHasOpened(true);
        }}
        className="relative p-2 text-dark hover:bg-sand rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center px-1 rounded-full text-[9px] font-black text-white bg-rose-600 border-2 border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {hasOpened && (
        <NotificationCenter 
          isOpen={isOpen} 
          onClose={() => {
            setIsOpen(false);
            fetchUnread();
          }} 
        />
      )}
    </>
  );
}
