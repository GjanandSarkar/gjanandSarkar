import { LayoutDashboard, ShoppingBag, Store, Activity, type LucideIcon } from 'lucide-react';

export interface FranchiseNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
}

export const FRANCHISE_NAV: FranchiseNavItem[] = [
  { href: '/seller/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/seller/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/seller/store', label: 'Products & stock', icon: Store },
  { href: '/seller/activity', label: 'Activity log', icon: Activity },
];

