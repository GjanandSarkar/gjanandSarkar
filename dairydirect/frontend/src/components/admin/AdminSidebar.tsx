"use client";

import React from 'react';
import {
  LayoutDashboard, ShoppingBag, Users, Package, BarChart3,
  Truck, ShieldCheck, Tags, Building2, Store, RotateCcw,
  Megaphone, Boxes, Ticket, History, Settings, ShieldAlert
} from 'lucide-react';
import { Sidebar, SidebarItem } from '@/components/shared/Sidebar';

const adminNavItems: SidebarItem[] = [
  // ── Overview ──
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true, section: 'Overview' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },

  // ── Operations & Orders ──
  { href: '/admin/orders', icon: ShoppingBag, label: 'Admin Orders', exact: true, section: 'Operations' },
  { href: '/admin/seller-orders', icon: Store, label: 'All Seller Orders' },
  { href: '/admin/delivery', icon: Truck, label: 'Deliveries' },
  { href: '/admin/returns', icon: RotateCcw, label: 'Returns & Refunds' },

  // ── Catalog & Stock ──
  { href: '/admin/products', icon: Package, label: 'Products', exact: true, section: 'Catalog & Stock' },
  { href: '/admin/categories', icon: Tags, label: 'Categories' },
  { href: '/admin/inventory', icon: Boxes, label: 'Inventory & Stock' },
  { href: '/admin/products/approvals', icon: ShieldCheck, label: 'Product Approvals' },

  // ── Sellers & Vendors ──
  { href: '/admin/sellers', icon: Store, label: 'Sellers', section: 'Sellers' },
  { href: '/admin/vendor-inquiries', icon: Building2, label: 'Seller Inquiries' },
  { href: '/admin/quality-reports', icon: ShieldAlert, label: 'Quality Reports' },

  // ── Customers & Marketing ──
  { href: '/admin/customers', icon: Users, label: 'Customers', section: 'Customers & Growth' },
  { href: '/admin/coupons', icon: Ticket, label: 'Coupons' },
  { href: '/admin/campaigns', icon: Megaphone, label: 'Ad Campaigns' },

  // ── System & Audit ──
  { href: '/admin/audit', icon: History, label: 'Audit Log', section: 'System' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export interface AdminSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ isOpenMobile, onCloseMobile }: AdminSidebarProps = {}) {
  return (
    <Sidebar
      items={adminNavItems}
      title="Admin Portal"
      isOpenMobile={isOpenMobile}
      onCloseMobile={onCloseMobile}
    />
  );
}
