'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminRailContextType {
  isCollapsed: boolean;
  toggleRail: () => void;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  badgeCounts: Record<string, number>;
  setBadgeCount: (key: string, count: number) => void;
}

const AdminRailContext = createContext<AdminRailContextType | null>(null);

export function AdminRailProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({
    pendingOrders: 0,
    pendingApprovals: 0,
    openInquiries: 0,
    openReturns: 0,
  });

  // Hydrate persistence from localStorage key `gss.admin.rail`
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gss.admin.rail');
      if (saved === 'collapsed') {
        setIsCollapsed(true);
      }
    } catch {}
  }, []);

  const toggleRail = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gss.admin.rail', next ? 'collapsed' : 'expanded');
      } catch {}
      return next;
    });
  };

  const setCollapsed = (val: boolean) => {
    setIsCollapsed(val);
    try {
      localStorage.setItem('gss.admin.rail', val ? 'collapsed' : 'expanded');
    } catch {}
  };

  const setBadgeCount = (key: string, count: number) => {
    setBadgeCounts((prev) => ({ ...prev, [key]: count }));
  };

  return (
    <AdminRailContext.Provider
      value={{
        isCollapsed,
        toggleRail,
        setCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        badgeCounts,
        setBadgeCount,
      }}
    >
      {children}
    </AdminRailContext.Provider>
  );
}

export function useAdminRail() {
  const ctx = useContext(AdminRailContext);
  if (!ctx) {
    throw new Error('useAdminRail must be used within an AdminRailProvider');
  }
  return ctx;
}

