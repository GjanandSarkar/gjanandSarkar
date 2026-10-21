"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Plus,
  X,
  Bell
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useCartDetails } from '@/hooks/useCartDetails';
import { getUserAddresses, normalizeUserAddress, type UserAddress } from '@/lib/api/addresses';
import { getUnreadCount, subscribeToNotifications } from '@/lib/api/notifications';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/DropdownMenu';

const ROTATING_SEARCH_HINTS = [
  'Search for "Gir Cow A2 Milk"',
  'Search for "Pure Bilona Ghee"',
  'Search for "Fresh Malai Paneer"',
  'Search for "Cold-Pressed Mustard Oil"',
  'Search for "Organic Farm Butter"',
  'Search for "Traditional Indian Sweets"',
];

function HeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useStore((state) => state.user);
  const storeLogout = useStore((state) => state.logout);
  const wishlist = useStore((state) => state.wishlist);
  const checkoutAddressId = useStore((state) => state.checkoutAddressId);
  const setCheckoutAddressId = useStore((state) => state.setCheckoutAddressId);
  const setCartDrawerOpen = useStore((state) => state.setCartDrawerOpen);
  const setNotificationDrawerOpen = useStore((state) => state.setNotificationDrawerOpen);
  const { totalItems, subtotal } = useCartDetails();

  const [searchTerm, setSearchTerm] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [isMobileAddressDrawerOpen, setIsMobileAddressDrawerOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Fetch unread notifications count for desktop bell
  useEffect(() => {
    if (!user?.id) {
      setUnreadNotificationsCount(0);
      return;
    }
    getUnreadCount(user.id, user.role).then(setUnreadNotificationsCount);
    const unsubscribe = subscribeToNotifications(user.id, () => {
      setUnreadNotificationsCount((c) => c + 1);
    });
    return unsubscribe;
  }, [user]);

  // Rotating Swiggy/Zomato style placeholder animation
  useEffect(() => {
    const hintTimer = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % ROTATING_SEARCH_HINTS.length);
    }, 3000);
    return () => clearInterval(hintTimer);
  }, []);

  // Fetch addresses when user is logged in (use already hydrated store addresses if available)
  useEffect(() => {
    if (!user?.id) {
      setUserAddresses([]);
      return;
    }

    if (user.saved_addresses && user.saved_addresses.length > 0) {
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
    } else {
      getUserAddresses(user.id).then((addrs) => {
        if (addrs && addrs.length > 0) {
          setUserAddresses(addrs);
        }
      });
    }
  }, [user?.id, user?.saved_addresses?.length]);

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
      className="w-full relative flex items-center bg-surface hover:bg-surface-muted/50 border border-border rounded-2xl shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200 overflow-hidden"
    >
      <div className="pl-3.5 pr-2 text-primary pointer-events-none shrink-0">
        <Search className="w-4 h-4 stroke-[2.2]" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={ROTATING_SEARCH_HINTS[hintIndex]}
        aria-label="Search products"
        className="flex-1 min-w-0 py-2.5 pr-2 text-xs md:text-sm bg-transparent text-foreground placeholder:text-foreground-muted/80 outline-none transition-all duration-300 font-medium"
      />
      {searchTerm ? (
        <button
          type="button"
          onClick={() => setSearchTerm('')}
          className="p-1.5 mr-2 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface-muted cursor-pointer transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="flex items-center gap-2 pr-3 shrink-0">
          <div className="h-4 w-px bg-border/80" />
          <button
            type="submit"
            className="text-primary hover:text-primary-hover p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}
    </form>
  );

  return (
    <header className="sticky top-0 w-full z-40 bg-surface/95 backdrop-blur-md border-b border-border shadow-2xs transition-colors duration-150 relative">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 md:h-18 flex items-center justify-between gap-3 md:gap-6">
        
        {/* ── Brand Logo (Hidden on mobile phone mode per feedback) ── */}
        <Link
          href="/home"
          className="hidden md:flex items-center gap-2 shrink-0 group active:scale-95 transition-transform"
        >
          <div className="relative flex items-center">
            <img
              src="/application logo/gjanand sarkar logo.png"
              alt="Gjanand Sarkar"
              className="h-9 md:h-11 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col ml-1.5">
              <span className="text-lg md:text-xl font-black tracking-tight leading-none text-primary">
                Gjanand
              </span>
              <span className="text-[9px] tracking-[0.25em] font-extrabold text-foreground-muted uppercase leading-none mt-0.5">
                SARKAR
              </span>
            </div>
          </div>
        </Link>

        {/* ── Delivery Location Selector (Blinkit pattern) ── */}
        <div className="flex items-center min-w-0 flex-1 md:flex-initial">
          {/* Mobile Location Trigger (Opens Bottom Drawer for easy thumb access) */}
          <div className="block md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileAddressDrawerOpen(true)}
              className="h-10 flex items-center gap-2 px-2 py-1 rounded-xl bg-surface hover:bg-surface-muted border border-border/80 transition-all text-left group cursor-pointer max-w-[210px] active:scale-95"
              aria-label="Select delivery address"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-extrabold text-foreground truncate flex items-center gap-0.5 leading-tight">
                  <span>{activeAddress?.label || 'Select Location'}</span>
                  <ChevronDown className="w-3 h-3 text-foreground-muted opacity-80 shrink-0" />
                </span>
                <span className="text-[10px] font-semibold text-foreground-muted truncate leading-tight mt-0.5">
                  15-20 Mins • {activeAddress?.address || 'Instant Delivery'}
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Location Selector (Opens Dropdown Menu) */}
          <div className="hidden md:block">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-11 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-muted border border-border/80 transition-all text-left group cursor-pointer max-w-[240px] active:scale-95"
                    aria-label="Select delivery address"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <MapPin className="w-4.5 h-4.5 stroke-[2.2]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-extrabold text-foreground truncate flex items-center gap-0.5 leading-tight">
                        <span>{activeAddress?.label || 'Home'}</span>
                        <ChevronDown className="w-3 h-3 text-foreground-muted opacity-80 group-hover:translate-y-0.5 transition-transform shrink-0" />
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-foreground-muted truncate leading-tight mt-0.5">
                        15-20 Mins • {activeAddress?.address || 'Select Address'}
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" collisionPadding={12} className="w-80 max-w-[340px] p-2 rounded-xl">
                  <DropdownMenuLabel className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      Delivery Addresses
                    </span>
                    <Link
                      href="/profile/saved-addresses"
                      className="text-[11px] font-bold text-primary hover:underline"
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
                                  <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.2 rounded font-bold">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-foreground-muted line-clamp-2 mt-0.5">
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
                        <p className="text-xs text-foreground-muted">No saved addresses found</p>
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
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-11 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-muted border border-border/80 transition-all text-left group cursor-pointer max-w-[240px] active:scale-95"
                    aria-label="Select location"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <MapPin className="w-4.5 h-4.5 stroke-[2.2]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-extrabold text-foreground truncate flex items-center gap-0.5 leading-tight">
                        <span>Select Location</span>
                        <ChevronDown className="w-3 h-3 text-foreground-muted opacity-80 group-hover:translate-y-0.5 transition-transform shrink-0" />
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-foreground-muted truncate leading-tight mt-0.5">
                        15-20 Mins • Instant Delivery
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  collisionPadding={12}
                  className="w-80 max-w-[340px] p-3 rounded-xl"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Delivery Location</p>
                        <p className="text-[10px] text-foreground-muted">Fastest delivery in 15-20 mins</p>
                      </div>
                    </div>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      Sign in to see your saved addresses or add a new delivery location.
                    </p>
                    <Link
                      href="/login"
                      className="flex items-center justify-center w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                    >
                      Login to Select Address
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* ── Search Bar (desktop/tablet: inline) ── */}
        <div className="hidden md:flex flex-1 max-w-xl mx-auto">{searchForm}</div>

        {/* ── Right Quick Actions ── */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Cart CTA on right side */}
          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="h-10 sm:h-11 relative flex items-center justify-center w-10 sm:w-auto px-2.5 sm:px-4 rounded-xl bg-primary hover:bg-primary-hover text-white transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
            aria-label="Cart"
            title="Cart"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
              {totalItems > 0 && (
                <span className="absolute -top-2.5 -right-2.5 min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs border-2 border-surface leading-none animate-in zoom-in-50">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-white ml-2">
              Cart {totalItems > 0 ? `(₹${subtotal})` : ''}
            </span>
          </button>

          {/* ── Notification Bell (Desktop, right side of Cart) ── */}
          <button
            type="button"
            onClick={() => setNotificationDrawerOpen(true)}
            className="hidden md:flex h-11 w-11 items-center justify-center rounded-xl bg-surface hover:bg-surface-muted text-foreground border border-border/80 hover:border-border transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 relative"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-foreground stroke-[2]" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs border-2 border-surface leading-none animate-in zoom-in-50">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* ── User Profile Dropdown (via Radix DropdownMenu - desktop only, mobile has BottomNav profile) ── */}
          <div className="hidden md:block">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-11 flex items-center gap-2 px-2.5 rounded-xl hover:bg-surface-muted border border-border/70 hover:border-border transition-all cursor-pointer group outline-none active:scale-95"
                aria-label="Account Menu"
              >
                <div className="w-7 h-7 rounded-full bg-surface-muted flex items-center justify-center overflow-hidden border border-border group-hover:border-primary transition-colors shadow-2xs">
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

                  {user.role === 'seller' ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/seller/dashboard"
                        className="flex items-center gap-2.5 py-2 font-bold text-primary bg-primary/10"
                      >
                        <Store className="w-4 h-4 text-primary" />
                        <span>Seller Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  ) : user.role === 'admin' ? (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin/products"
                        className="flex items-center gap-2.5 py-2 font-bold text-purple-600 bg-purple-500/10"
                      >
                        <Store className="w-4 h-4 text-purple-600" />
                        <span>Admin Console</span>
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/become-seller"
                        className="flex items-center gap-2.5 py-2"
                      >
                        <Store className="w-4 h-4 text-muted" />
                        <span>Become a Seller</span>
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
                <div className="p-3 text-center space-y-2">
                  <p className="text-xs font-bold text-foreground">
                    Welcome to Gjanand Sarkar
                  </p>
                  <p className="text-[11px] text-muted">
                    Login to manage orders, subscriptions & saved addresses
                  </p>
                  <Link
                    href="/login"
                    className="block w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-colors text-center shadow-xs"
                  >
                    Login / Sign Up
                  </Link>
                  <Link
                    href="/become-seller"
                    className="block w-full py-1.5 text-[11px] text-foreground-muted hover:text-foreground font-semibold text-center transition-colors hover:underline"
                  >
                    Become a Seller
                  </Link>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>

        </div>
      </div>

      {/* Search gets its own full-width row on phones */}
      <div className="md:hidden px-4 pb-3 -mt-1">{searchForm}</div>

      {/* Progressive blur edge strip under the navbar */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-full h-3 bg-gradient-to-b from-surface/70 via-surface/20 to-transparent backdrop-blur-[3px]"
        style={{
          maskImage: 'linear-gradient(to bottom, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
        }}
        aria-hidden="true"
      />

      {/* Mobile Address Bottom Drawer (Thumb-friendly slide-up drawer) */}
      <AnimatePresence>
        {isMobileAddressDrawerOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileAddressDrawerOpen(false)}
            />

            {/* Bottom Drawer Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl border-t border-border p-4 shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
            >
              {/* Drag Pill */}
              <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-3" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Delivery Location</h3>
                    <p className="text-[11px] text-foreground-muted">Fastest delivery in 15-20 mins</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileAddressDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-surface-muted text-foreground-muted hover:text-foreground cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Addresses List */}
              <div className="py-3 space-y-2 flex-1 overflow-y-auto">
                {user ? (
                  userAddresses.length > 0 ? (
                    userAddresses.map((addr, idx) => {
                      const isSelected =
                        activeAddress?.id === addr.id ||
                        (activeAddress?.label === addr.label && activeAddress?.address === addr.address);
                      return (
                        <button
                          key={addr.id || `mobile-addr-${idx}`}
                          type="button"
                          onClick={() => {
                            setCheckoutAddressId(addr.id || addr.label);
                            setIsMobileAddressDrawerOpen(false);
                          }}
                          className={`w-full flex items-start justify-between p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-primary/10 border-primary/40 text-primary'
                              : 'bg-surface hover:bg-surface-muted border-border text-foreground'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">{addr.label}</span>
                              {addr.is_default && (
                                <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-foreground-muted line-clamp-2 mt-1">
                              {addr.address}
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary shrink-0 mt-1" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center space-y-2">
                      <p className="text-xs text-foreground-muted">No saved addresses found</p>
                    </div>
                  )
                ) : (
                  <div className="py-4 text-center space-y-3">
                    <p className="text-xs text-foreground-muted">
                      Sign in to view saved delivery locations and order history.
                    </p>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileAddressDrawerOpen(false)}
                      className="inline-flex items-center justify-center w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Login to Select Address
                    </Link>
                  </div>
                )}
              </div>

              {/* Bottom Action: Add New Address */}
              {user && (
                <div className="pt-2 border-t border-border/60">
                  <Link
                    href="/profile/saved-addresses"
                    onClick={() => setIsMobileAddressDrawerOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/15 rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Delivery Address</span>
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
