'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, 
  ArrowRight, 
  Clock, 
  X,
  Plus,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { ALL_ADMIN_NAV_ITEMS } from '@/app/admin/_nav';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PaletteItem {
  id: string;
  label: string;
  href: string;
  group: string;
  icon?: any;
  subtext?: string;
}

const STATIC_ACTIONS: PaletteItem[] = [
  { id: 'act-add-prod', label: 'Create New Product', href: '/admin/products/add', group: 'ACTIONS', icon: Plus },
  { id: 'act-approvals', label: 'Review Pending Approvals', href: '/admin/products/approvals', group: 'ACTIONS', icon: ShieldCheck },
  { id: 'act-storefront', label: 'Open Customer Storefront', href: '/home', group: 'ACTIONS', icon: ExternalLink },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentHrefs, setRecentHrefs] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Load and sync recent routes
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gss.admin.recent');
      if (stored) {
        setRecentHrefs(JSON.parse(stored));
      }
    } catch {}
  }, [open]);

  // Track visited route in recents
  useEffect(() => {
    if (!pathname || !pathname.startsWith('/admin')) return;
    try {
      const stored = localStorage.getItem('gss.admin.recent');
      const list: string[] = stored ? JSON.parse(stored) : [];
      const updated = [pathname, ...list.filter((h) => h !== pathname)].slice(0, 6);
      localStorage.setItem('gss.admin.recent', JSON.stringify(updated));
    } catch {}
  }, [pathname]);

  // Build recents list
  const recentItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [];
    for (const href of recentHrefs) {
      const found = ALL_ADMIN_NAV_ITEMS.find((n) => n.href === href);
      if (found) {
        items.push({
          id: `recent-${found.href}`,
          label: found.label,
          href: found.href,
          group: 'RECENT',
          icon: Clock,
          subtext: found.group,
        });
      }
    }
    return items;
  }, [recentHrefs]);

  // Filtered items based on query
  const filteredItems: PaletteItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...recentItems, ...STATIC_ACTIONS, ...ALL_ADMIN_NAV_ITEMS.map((n) => ({
        id: `nav-${n.href}`,
        label: n.label,
        href: n.href,
        group: n.group,
        icon: n.icon,
      }))];
    }

    const matches: PaletteItem[] = [];

    // Filter static actions
    STATIC_ACTIONS.forEach((a) => {
      if (a.label.toLowerCase().includes(q) || a.group.toLowerCase().includes(q)) {
        matches.push(a);
      }
    });

    // Filter nav items
    ALL_ADMIN_NAV_ITEMS.forEach((n) => {
      if (
        n.label.toLowerCase().includes(q) ||
        n.group.toLowerCase().includes(q) ||
        n.href.toLowerCase().includes(q)
      ) {
        matches.push({
          id: `nav-${n.href}`,
          label: n.label,
          href: n.href,
          group: n.group,
          icon: n.icon,
        });
      }
    });

    return matches;
  }, [query, recentItems]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      onOpenChange(false);
      router.push(item.href);
    },
    [onOpenChange, router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        handleSelect(current);
      }
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-xl overflow-hidden bg-surface border border-border shadow-2xl rounded-[var(--radius-xl)] top-[20%] translate-y-0">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 h-13 border-b border-border gap-3">
          <Search className="w-4 h-4 text-foreground-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search console routes or actions… (↑↓ navigate, ⏎ jump)"
            className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-foreground-muted/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-foreground-muted hover:text-foreground rounded-[var(--radius-sm)]"
              aria-label="Clear query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-muted border border-border text-foreground-muted">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-foreground-muted">
              No matching routes or console actions for &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon || ArrowRight;
              return (
                <button
                  key={`${item.id}-${index}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-md)] text-xs text-left cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-secondary text-on-secondary shadow-xs'
                      : 'text-foreground hover:bg-surface-muted'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={cn('w-4 h-4 shrink-0', isSelected ? 'text-on-secondary' : 'text-foreground-muted')} />
                    <span className="font-medium truncate">{item.label}</span>
                    {item.subtext && (
                      <span className={cn('text-[10px] opacity-75 truncate', isSelected ? 'text-on-secondary' : 'text-foreground-muted')}>
                        • {item.subtext}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-mono uppercase tracking-wider shrink-0 ml-2',
                      isSelected ? 'text-on-secondary/80' : 'text-foreground-muted'
                    )}
                  >
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 bg-surface-muted/50 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
          <span>Jump to operations screen</span>
          <span className="font-mono text-[10px]">⌘K / Ctrl+K</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
