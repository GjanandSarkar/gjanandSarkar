"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Loader2 } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const setNotificationDrawerOpen = useStore((s) => s.setNotificationDrawerOpen);

  useEffect(() => {
    // Notifications are displayed via the responsive global drawer/sidebar
    setNotificationDrawerOpen(true);
    router.replace('/home');
  }, [router, setNotificationDrawerOpen]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 text-sm font-semibold text-foreground-muted">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span>Opening notifications...</span>
      </div>
    </div>
  );
}
