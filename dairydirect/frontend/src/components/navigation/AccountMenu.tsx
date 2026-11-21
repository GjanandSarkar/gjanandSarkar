"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ChevronDown,
  Package,
  Heart,
  MapPin,
  Sparkles,
  Store,
  LogOut,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';

interface AccountMenuProps {
  className?: string;
}

export function AccountMenu({ className }: AccountMenuProps) {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const storeLogout = useStore((state) => state.logout);
  const wishlist = useStore((state) => state.wishlist);

  const handleLogout = async () => {
    try {
      const { logout: apiLogout } = await import('@/lib/api/auth');
      await apiLogout();
    } catch (e) {
      console.error('Logout error', e);
    }
    storeLogout();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="h-11 flex items-center gap-2 px-2.5 rounded-[var(--radius-md)] hover:bg-surface-muted border border-border transition-all duration-[var(--dur-state)] ease-[var(--ease-standard)] cursor-pointer group outline-none active:scale-95 select-none"
            aria-label="Account Menu"
          >
            <div className="w-7 h-7 rounded-full bg-surface-muted flex items-center justify-center overflow-hidden border border-border group-hover:border-brand-ink transition-colors shrink-0">
              <img
                src={user?.avatar_url || '/profile/profile.jpg'}
                alt={user?.name || 'Profile'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/profile/profile.jpg';
                }}
              />
            </div>
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-[11px] font-semibold text-foreground group-hover:text-brand-ink whitespace-nowrap flex items-center gap-0.5">
                {user ? (user.name ? user.name.split(' ')[0] : 'Account') : 'Login'}
                <ChevronDown className="w-3 h-3 text-foreground-muted" />
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl">
          {user ? (
            <>
              {/* User Profile Header */}
              <div className="px-3 py-2 bg-surface-muted rounded-lg border border-border mb-1">
                <p className="text-xs font-bold text-foreground truncate">
                  {user.name || 'Gjanand Customer'}
                </p>
                <p className="text-[11px] text-foreground-muted truncate">
                  {user.phone || user.email || 'Logged In'}
                </p>
                {user.role && user.role !== 'customer' && (
                  <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-secondary text-on-secondary rounded-full">
                    {user.role}
                  </span>
                )}
              </div>

              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2.5 py-2">
                  <User className="w-4 h-4 text-foreground-muted" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/orders" className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-foreground-muted" />
                    <span>My Orders</span>
                  </div>
                  <span className="text-[10px] text-foreground-muted">Track</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/wishlist" className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-error" />
                    <span>Wishlist</span>
                  </div>
                  {wishlist.length > 0 && (
                    <span className="bg-error-bg text-error text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {wishlist.length}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/profile/saved-addresses" className="flex items-center gap-2.5 py-2">
                  <MapPin className="w-4 h-4 text-foreground-muted" />
                  <span>Saved Addresses</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/subscribe" className="flex items-center gap-2.5 py-2">
                  <Sparkles className="w-4 h-4 text-brand-ink" />
                  <span>Subscriptions</span>
                </Link>
              </DropdownMenuItem>

              {user.role === 'seller' ? (
                <DropdownMenuItem asChild>
                  <Link
                    href="/seller/dashboard"
                    className="flex items-center gap-2.5 py-2 font-bold text-secondary bg-navy-50 dark:bg-navy-700/30"
                  >
                    <Store className="w-4 h-4 text-secondary" />
                    <span>Seller Dashboard</span>
                  </Link>
                </DropdownMenuItem>
              ) : user.role === 'admin' ? (
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin/products"
                    className="flex items-center gap-2.5 py-2 font-bold text-secondary bg-navy-50 dark:bg-navy-700/30"
                  >
                    <Store className="w-4 h-4 text-secondary" />
                    <span>Admin Console</span>
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/become-seller" className="flex items-center gap-2.5 py-2">
                    <Store className="w-4 h-4 text-foreground-muted" />
                    <span>Become a Seller</span>
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-error focus:text-error focus:bg-error-bg cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
            </>
          ) : (
            <div className="p-3 text-center space-y-2">
              <p className="text-xs font-bold text-foreground">Welcome to Gjanand Sarkar</p>
              <p className="text-[11px] text-foreground-muted">
                Login to manage orders, subscriptions & saved addresses
              </p>
              <Link
                href="/login"
                className="block w-full py-2 bg-primary text-on-primary text-xs font-bold rounded-lg transition-colors text-center shadow-xs hover:bg-primary-hover"
              >
                Login / Sign Up
              </Link>
              <Link
                href="/become-seller"
                className="block w-full py-1 text-[11px] text-foreground-muted hover:text-foreground font-semibold text-center hover:underline"
              >
                Become a Seller
              </Link>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
