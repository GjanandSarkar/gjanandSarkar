"use client";

import React from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface AccountMenuProps {
  className?: string;
}

export function AccountMenu({ className }: AccountMenuProps) {
  const user = useStore(state => state.user);

  return (
    <Link
      href={user ? "/profile" : "/login"}
      className={cn(
        "flex items-center gap-2 h-12 px-3 rounded-xl transition-all hover:bg-surface-muted active:scale-95",
        "text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      aria-label={user ? "Go to profile" : "Log in"}
    >
      <div className="w-8 h-8 rounded-full bg-surface-muted border border-border flex items-center justify-center shrink-0">
        <User className="w-4 h-4 text-foreground-muted" />
      </div>
      <span className="text-body-md font-medium hidden lg:block">
        {user ? user.name?.split(' ')[0] || 'Account' : 'Login'}
      </span>
    </Link>
  );
}
