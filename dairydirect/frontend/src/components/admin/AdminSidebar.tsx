"use client";

import React from 'react';
import {
  LayoutDashboard, ShoppingBag, Users, Package, BarChart3,
  Truck, ShieldCheck, Tags, Building2, Store, RotateCcw, Megaphone, Leaf
} from 'lucide-react';
import { Sidebar, SidebarItem } from '@/components/shared/Sidebar';

const adminNavItems: SidebarItem[] = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/sellers', icon: Store, label: 'Sellers' },
  { href: '/admin/vendor-inquiries', icon: Building2, label: 'Seller Applications' },
  { href: '/admin/products/approvals', icon: ShieldCheck, label: 'Product Approvals' },
  { href: '/admin/quality-reports', icon: ShieldCheck, label: 'Quality Reports' },
  { href: '/admin/products', icon: Package, label: 'Products', exact: true },
  { href: '/admin/categories', icon: Tags, label: 'Categories' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Admin Orders', exact: true },
  { href: '/admin/seller-orders', icon: Store, label: 'All Seller Orders List' },
  { href: '/admin/returns', icon: RotateCcw, label: 'Returns & Cancellations' },
  { href: '/admin/customers', icon: Users, label: 'Customers' },
  { href: '/admin/delivery', icon: Truck, label: 'Deliveries' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/coupons', icon: Package, label: 'Coupons' },
  { href: '/admin/audit', icon: ShieldCheck, label: 'Audit Log' },
  { href: '/admin/campaigns', icon: Megaphone, label: 'Ad Campaigns' },
];

export function AdminSidebar() {
  return <Sidebar items={adminNavItems} title="Admin Portal" />;
}
