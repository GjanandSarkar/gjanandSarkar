"use client";

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import dynamic from 'next/dynamic';

const NotificationCenter = dynamic(() => import('./NotificationCenter').then(mod => mod.NotificationCenter), {
  ssr: false,
});

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Dummy unread count to simulate engagement
  const unreadCount = 2;

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
