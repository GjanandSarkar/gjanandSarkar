"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Store,
  Package,
  Heart,
  ShoppingCart,
  User,
  ChevronDown,
  Check,
  Sparkles,
  MapPin,
  LogOut,
  Plus
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useCartDetails } from '@/hooks/useCartDetails';
import { getUserAddresses, normalizeUserAddress, type UserAddress } from '@/lib/api/addresses';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/DropdownMenu';

function HeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useStore((state) => state.user);
  const storeLogout = useStore((state) => state.logout);
  const wishlist = useStore((state) => state.wishlist);
  const checkoutAddressId = useStore((state) => state.checkoutAddressId);
  const setCheckoutAddressId = useStore((state) => state.setCheckoutAddressId);
  const { totalItems } = useCartDetails();

  const [searchTerm, setSearchTerm] = useState('');
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);

  // Fetch addresses when user is logged in
  useEffect(() => {
    if (user?.id) {
      getUserAddresses(user.id).then((addrs) => {
        if (addrs && addrs.length > 0) {
          setUserAddresses(addrs);
        } else if (user.saved_addresses && user.saved_addresses.length > 0) {
          setUserAddresses(
            user.saved_addresses.map((a, i) =>
              normalizeUserAddress({
                id: `saved-${i}`,
                user_id: user.id,
                label: a.label,
                address: a.address,
                is_default: i === 0,
                created_at: new Date().toISOString(),
              })
            )
          );
        }
      });
    } else {
      setUserAddresses([]);
    }
  }, [user?.id, user?.saved_addresses]);

  // Synchronize search term with URL parameters
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q !== null && q !== undefined) {
      setSearchTerm(q);
    }
  }, [searchParams]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (searchTerm.trim()) {
      queryParams.set('search', searchTerm.trim());
    }
    const queryStr = queryParams.toString();
    router.push(`/search${queryStr ? `?${queryStr}` : ''}`);
  };

  // Find active selected address
  const activeAddress =
    userAddresses.find((a) => a.id === checkoutAddressId || a.label === checkoutAddressId) ||
    userAddresses.find((a) => a.is_default) ||
    userAddresses[0] ||
    (user?.address
      ? {
          id: 'default-profile',
          label: 'Default',
          address: user.address,
          user_id: user.id,
          lat: null,
          lng: null,
          is_default: true,
          created_at: '',
        }
      : null);

  const searchForm = (
    <form
      onSubmit={handleSearch}
      className="w-full relative flex items-center bg-surface-muted border border-border/80 rounded-xl overflow-hidden focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20 transition-all duration-200"
    >
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search Gir cow milk, bilona ghee, paneer, honey..."
        aria-label="Search products"
        className="flex-1 min-w-0 px-3.5 md:px-4 py-2.5 text-xs md:text-sm bg-transparent text-foreground placeholder:text-muted outline-none"
      />
      <button
        type="submit"
        className="bg-secondary hover:bg-secondary-hover text-white px-4 h-10 md:h-11 min-w-[44px] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        aria-label="Search"
      >
        <Search className="w-4 h-4 stroke-[2.5]" />
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 w-full z-40 bg-surface/95 backdrop-blur-md border-b border-border/80 shadow-2xs transition-colors duration-150">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-3 md:gap-8">
        
        {/* ── Brand Logo ── */}
        <Link
          href="/home"
          className="flex items-center gap-2 shrink-0 group active:scale-95 transition-transform"
        >
          <div className="relative flex items-center">
            <img
              src="/application logo/gjanand sarkar logo.png"
              alt="Gjanand Sarkar"
              className="h-10 md:h-13 w-auto object-contain drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col ml-1">
              <span className="text-xl md:text-2xl font-black tracking-tight leading-none text-primary">
                Gjanand
              </span>
              <span className="text-[9px] md:text-[10px] tracking-[0.25em] font-black text-secondary uppercase text-right leading-none mt-0.5">
                SARKAR
              </span>
            </div>
          </div>
        </Link>

        {/* ── Delivery Address Selection (Quick Commerce Style Pill) ── */}
        {user && (
          <div className="hidden sm:block shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-elevated border border-border/80 transition-all text-left group cursor-pointer"
                  aria-label="Select delivery address"
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15 group-hover:scale-105 transition-transform">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col max-w-[120px] lg:max-w-[180px]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted flex items-center gap-1">
                      Deliver to {user.name ? user.name.split(' ')[0] : 'You'}
                      <ChevronDown className="w-3 h-3 text-muted opacity-70 group-hover:translate-y-0.5 transition-transform" />
                    </span>
                    <span className="text-xs font-bold text-foreground truncate">
                      {activeAddress
                        ? `${activeAddress.label}: ${activeAddress.address}`
                        : 'Select Address'}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-80 p-2 rounded-xl">
                <DropdownMenuLabel className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="flex items-center gap-1.5 text-foreground font-black text-xs">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    Delivery Addresses
                  </span>
                  <Link
                    href="/profile/saved-addresses"
                    className="text-[11px] font-bold text-secondary hover:underline"
                  >
                    Manage
                  </Link>
                </DropdownMenuLabel>

                <div className="max-h-60 overflow-y-auto p-1 space-y-1">
                  {userAddresses.length > 0 ? (
                    userAddresses.map((addr, idx) => {
                      const isSelected =
                        activeAddress?.id === addr.id ||
                        (activeAddress?.label === addr.label &&
                          activeAddress?.address === addr.address);
                      return (
                        <button
                          key={addr.id || `addr-${idx}-${addr.label}`}
                          type="button"
                          onClick={() => setCheckoutAddressId(addr.id || addr.label)}
                          className={`w-full flex items-start justify-between p-2.5 rounded-lg transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 border border-primary/30 text-primary'
                              : 'hover:bg-surface-muted text-foreground'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">
                                {addr.label}
                              </span>
                              {addr.is_default && (
                                <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.2 rounded font-black">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted line-clamp-2 mt-0.5">
                              {addr.address}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-xs text-muted">No saved addresses found</p>
                      <Link
                        href="/profile/saved-addresses"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Your First Address
                      </Link>
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator />

                <div className="pt-1">
                  <Link
                    href="/profile/saved-addresses"
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/15 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add New Delivery Address
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* ── Search Bar (desktop/tablet: inline) ── */}
        <div className="hidden md:flex flex-1 max-w-xl mx-auto">{searchForm}</div>

        {/* ── Right Quick Actions ── */}
        <div className="flex items-center gap-2.5 sm:gap-4 md:gap-5 shrink-0">

          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle />

          {/* Become Seller / Seller Hub */}
          <Link
            href={
              user?.role === 'seller'
                ? '/seller/dashboard'
                : user?.role === 'admin'
                ? '/admin/products'
                : '/become-seller'
            }
            className="hidden lg:flex flex-col items-center justify-center text-foreground hover:text-primary transition-colors group"
          >
            <Store className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">
              {user?.role === 'seller'
                ? 'Seller Hub'
                : user?.role === 'admin'
                ? 'Admin Panel'
                : 'Become Seller'}
            </span>
          </Link>

          <Link
            href="/offers"
            className="hidden lg:flex flex-col items-center justify-center text-foreground hover:text-primary transition-colors group"
          >
            <Sparkles className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">Offers</span>
          </Link>

          {/* Cart Icon & Count */}
          <Link
            href="/cart"
            className="flex flex-col items-center justify-center text-foreground hover:text-primary transition-colors relative group px-1"
            aria-label="View Cart"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-secondary text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Cart</span>
          </Link>

          {/* ── User Profile Dropdown (via Radix DropdownMenu) ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-surface-muted transition-colors cursor-pointer group outline-none"
                aria-label="Account Menu"
              >
                <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center overflow-hidden border border-border group-hover:border-primary transition-colors shadow-2xs">
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
                  <span className="text-[11px] font-bold text-foreground group-hover:text-primary whitespace-nowrap flex items-center gap-0.5">
                    {user ? (user.name ? user.name.split(' ')[0] : 'Account') : 'Login'}
                    <ChevronDown className="w-3 h-3 text-muted" />
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 p-2">
              {user ? (
                <>
                  {/* User Profile Header */}
                  <div className="px-3 py-2 bg-surface-muted rounded-lg border border-border/50 mb-1">
                    <p className="text-xs font-black text-foreground truncate">
                      {user.name || 'Gjanand Customer'}
                    </p>
                    <p className="text-[11px] text-muted truncate">
                      {user.phone || user.email || 'Logged In'}
                    </p>
                    {user.role && user.role !== 'customer' && (
                      <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-primary text-foreground-inverse rounded-full">
                        {user.role}
                      </span>
                    )}
                  </div>

                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2.5 py-2">
                      <User className="w-4 h-4 text-muted" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-muted" />
                        <span>My Orders</span>
                      </div>
                      <span className="text-[10px] text-muted">Track</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>Wishlist</span>
                      </div>
                      {wishlist.length > 0 && (
                        <span className="bg-rose-500/10 text-rose-600 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {wishlist.length}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/profile/saved-addresses" className="flex items-center gap-2.5 py-2">
                      <MapPin className="w-4 h-4 text-muted" />
                      <span>Saved Addresses</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/subscribe" className="flex items-center gap-2.5 py-2">
                      <Sparkles className="w-4 h-4 text-secondary" />
                      <span>Subscriptions</span>
                    </Link>
                  </DropdownMenuItem>

                  {user.role === 'seller' && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/seller/dashboard"
                        className="flex items-center gap-2.5 py-2 font-bold text-primary bg-primary/10"
                      >
                        <Store className="w-4 h-4 text-primary" />
                        <span>Seller Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/products"
                        className="flex items-center gap-2.5 py-2 font-bold text-purple-600 bg-purple-500/10"
                      >
                        <Store className="w-4 h-4 text-purple-600" />
                        <span>Admin Console</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-rose-600 focus:text-rose-600 focus:bg-rose-500/10 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <div className="p-3 text-center">
                  <p className="text-xs font-bold text-foreground mb-1">
                    Welcome to Gjanand Sarkar
                  </p>
                  <p className="text-[11px] text-muted mb-3">
                    Login to manage orders, dairy subscriptions & address
                  </p>
                  <Link
                    href="/login"
                    className="block w-full py-2 bg-primary hover:bg-primary-hover text-foreground-inverse text-xs font-bold rounded-xl transition-colors text-center"
                  >
                    Login / Sign Up
                  </Link>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      {/* Search gets its own full-width row on phones */}
      <div className="md:hidden px-4 pb-3 -mt-1">{searchForm}</div>
    </header>
  );
}

export function Header() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 w-full z-40 bg-surface border-b border-border shadow-2xs h-16 md:h-20" />
      }
    >
      <HeaderContent />
    </Suspense>
  );
}
