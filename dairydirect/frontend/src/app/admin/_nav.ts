import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Package,
  ShieldCheck,
  Tags,
  Layers,
  ShoppingBag,
  Store,
  RotateCcw,
  CalendarDays,
  BadgePercent,
  Users,
  Building2,
  Truck,
  Clock,
  MapPin,
  Settings,
  History,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: 'pendingOrders' | 'pendingApprovals' | 'openInquiries' | 'openReturns';
  exact?: boolean;
}

export interface AdminNavGroup {
  group: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    group: 'OVERVIEW',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
      { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    ],
  },
  {
    group: 'CATALOG',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package, exact: true },
      { href: '/admin/products/approvals', label: 'Product Approvals', icon: ShieldCheck, badgeKey: 'pendingApprovals' },
      { href: '/admin/categories', label: 'Categories', icon: Tags },
      { href: '/admin/inventory', label: 'Inventory', icon: Layers },
    ],
  },
  {
    group: 'COMMERCE',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, badgeKey: 'pendingOrders' },
      { href: '/admin/seller-orders', label: 'Seller Orders', icon: Store },
      { href: '/admin/returns', label: 'Returns', icon: RotateCcw, badgeKey: 'openReturns' },
      { href: '/admin/subscriptions', label: 'Subscriptions', icon: CalendarDays },
      { href: '/admin/coupons', label: 'Coupons & Offers', icon: BadgePercent },
    ],
  },
  {
    group: 'PEOPLE',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/sellers', label: 'Sellers', icon: Building2 },
      { href: '/admin/vendors', label: 'Vendors', icon: Truck },
      { href: '/admin/vendor-inquiries', label: 'Vendor Inquiries', icon: Clock, badgeKey: 'openInquiries' },
    ],
  },
  {
    group: 'OPERATIONS',
    items: [
      { href: '/admin/delivery', label: 'Delivery & Slots', icon: MapPin },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
      { href: '/admin/audit', label: 'Audit Log', icon: History },
    ],
  },
];

/** Flat list of all admin navigation items for command palette searching */
export const ALL_ADMIN_NAV_ITEMS: (AdminNavItem & { group: string })[] = ADMIN_NAV_GROUPS.flatMap((g) =>
  g.items.map((item) => ({ ...item, group: g.group }))
);

