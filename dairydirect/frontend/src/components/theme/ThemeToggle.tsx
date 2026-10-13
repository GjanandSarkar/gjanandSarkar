"use client";

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'badge' | 'dropdown-item';
  showLabel?: boolean;
}

export function ThemeToggle({
  className = '',
  variant = 'icon',
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';

  if (variant === 'dropdown-item') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
          "text-foreground hover:bg-surface-muted",
          className
        )}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <span className="flex items-center gap-2">
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-primary" />
          )}
          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted px-1.5 py-0.5 rounded bg-surface border border-border">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      className={cn(
        "relative flex items-center justify-center rounded-xl p-2 transition-all duration-200 cursor-pointer",
        "border border-border/80 bg-surface hover:bg-surface-muted text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs hover:scale-105 active:scale-95",
        showLabel ? "px-3 py-1.5 gap-2" : "w-9 h-9",
        className
      )}
    >
      <div className="relative w-4.5 h-4.5 flex items-center justify-center">
        <Sun
          className={cn(
            "w-4.5 h-4.5 text-amber-500 transition-all duration-300 absolute",
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "w-4.5 h-4.5 text-emerald-400 transition-all duration-300 absolute",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </div>

      {showLabel && (
        <span className="text-xs font-bold whitespace-nowrap">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
