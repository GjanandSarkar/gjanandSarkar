"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
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
import { useTranslation, type Language } from '@/lib/i18n';

function HeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useStore((state) => state.user);
  const storeLogout = useStore((state) => state.logout);
  const wishlist = useStore((state) => state.wishlist);
  const checkoutAddressId = useStore((state) => state.checkoutAddressId);
  const setCheckoutAddressId = useStore((state) => state.setCheckoutAddressId);
  const setLanguage = useStore((state) => state.setLanguage);
  const { totalItems } = useCartDetails();
  const { t, language } = useTranslation();

  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeUser = mounted ? user : null;

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const addressDropdownRef = useRef<HTMLDivElement>(null);
  const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addressTimeoutRef = useRef<NodeJS.Timeout | null>(null);


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

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (addressDropdownRef.current && !addressDropdownRef.current.contains(event.target as Node)) {
        setIsAddressOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
      if (addressTimeoutRef.current) clearTimeout(addressTimeoutRef.current);
    };
  }, []);

  const handleProfileMouseEnter = () => {
    if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
    setIsProfileOpen(true);
  };

  const handleProfileMouseLeave = () => {
    profileTimeoutRef.current = setTimeout(() => {
      setIsProfileOpen(false);
    }, 180);
  };

  const handleAddressMouseEnter = () => {
    if (addressTimeoutRef.current) clearTimeout(addressTimeoutRef.current);
    setIsAddressOpen(true);
  };

  const handleAddressMouseLeave = () => {
    addressTimeoutRef.current = setTimeout(() => {
      setIsAddressOpen(false);
    }, 180);
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
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
  const activeAddress = userAddresses.find(a => a.id === checkoutAddressId || a.label === checkoutAddressId)
    || userAddresses.find(a => a.is_default)
    || userAddresses[0]
    || (user?.address ? { id: 'default-profile', label: 'Default', address: user.address, user_id: user.id, lat: null, lng: null, is_default: true, created_at: '' } : null);

  /* One shared search form, rendered inline on desktop and as its own
     full-width row on phones. The header used to put the logo, the search box
     and the account/cart actions on a single row at EVERY breakpoint, so on a
     360px screen the search was squeezed into roughly 100px: the placeholder
     was unreadable and the gold submit button was clipped. */
  const searchForm = (
    <form
      onSubmit={handleSearch}
      className="w-full relative flex items-center bg-surface-muted/80 border border-border-hover rounded-lg overflow-visible focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all"
    >
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={t('searchPlaceholder') || "Search products, brands and more"}
        aria-label={t('search') || "Search products"}
        className="flex-1 min-w-0 px-3 md:px-4 py-2.5 text-sm bg-transparent text-foreground placeholder-foreground-muted outline-none rounded-l-lg"
      />
      <button
        type="submit"
        className="bg-secondary hover:bg-secondary-hover text-white px-4 h-11 min-w-[48px] flex items-center justify-center transition-colors shrink-0 rounded-r-lg cursor-pointer"
        aria-label={t('search') || "Search"}
      >
        <Search className="w-4 h-4 stroke-[2.5]" />
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 w-full z-40 bg-surface border-b border-border/80 shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-18 md:h-20 flex items-center justify-between gap-3 md:gap-8">

        {/* ── Brand Logo ── */}
        <Link href="/home" className="flex items-center gap-2 shrink-0 group active:scale-95 transition-transform">
          <div className="relative flex items-center">
            <img
              src="/application logo/gjanand sarkar logo.png"
              alt="Gjanand Sarkar"
              className="h-12 md:h-14 w-auto object-contain drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-semibold tracking-tight leading-none">
                <span className="text-primary">Gjanand</span>
              </span>
              <span className="text-xs md:text-xs tracking-[0.2em] font-semibold text-secondary uppercase text-right leading-none mt-0.5">
                SARKAR
              </span>
            </div>
          </div>
        </Link>

        {/* ── Search Bar (desktop/tablet: inline) ── */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-auto">{searchForm}</div>

        {/* ── Right Quick Actions ── */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0">

          {/* Become Seller / Seller Portal */}
          <Link
            href={activeUser?.role === 'seller' ? "/seller/dashboard" : activeUser?.role === 'admin' ? "/admin/products" : "/become-seller"}
            className="hidden lg:flex flex-col items-center justify-center text-foreground hover:text-primary transition-colors group"
          >
            <Store className="w-5 h-5 text-foreground-muted group-hover:text-primary transition-colors" />
            <span className="text-xs font-medium mt-0.5 whitespace-nowrap">
              {activeUser?.role === 'seller' ? (t('sellerHub') || 'Seller Hub') : activeUser?.role === 'admin' ? (t('adminPortal') || 'Admin Panel') : (t('partnerWithUs') || 'Become Seller')}
            </span>
          </Link>

          {/* Language Switcher Pill */}
          <div className="flex items-center rounded-lg border border-border bg-surface-muted p-0.5 text-xs font-semibold">
            {(['en', 'hi', 'gu'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                  language === l
                    ? 'bg-primary text-on-primary font-bold shadow-2xs'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title={l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी (Hindi)' : 'ગુજરાતી (Gujarati)'}
                aria-label={`Switch language to ${l}`}
              >
                {l === 'en' ? 'EN' : l === 'hi' ? 'हि' : 'ગુ'}
              </button>
            ))}
          </div>

          <ThemeToggle />


          {/* ── Delivery Address Selection (ONLY VISIBLE WHEN LOGGED IN) ── */}
          {activeUser && (
            <div
              ref={addressDropdownRef}
              onMouseEnter={handleAddressMouseEnter}
              onMouseLeave={handleAddressMouseLeave}
              className="relative hidden sm:block"
            >
              <button
                type="button"
                onClick={() => setIsAddressOpen(!isAddressOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-muted transition-colors text-left group cursor-pointer border border-transparent hover:border-border min-h-[44px]"
                aria-label="Select delivery address"
              >
                <div className="w-8 h-8 rounded-full bg-surface-muted text-primary flex items-center justify-center shrink-0 border border-border">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col max-w-[130px] lg:max-w-[170px]">
                  <span className="text-xs font-medium text-foreground-muted flex items-center gap-1">
                    {t('deliverTo') || 'Deliver to'} {activeUser.name ? activeUser.name.split(' ')[0] : ''}
                    <ChevronDown className={`w-3 h-3 text-foreground-muted transition-transform duration-200 ${isAddressOpen ? 'rotate-180' : ''}`} />
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {activeAddress ? `${activeAddress.label}: ${activeAddress.address}` : (t('selectAddress') || 'Select Address')}
                  </span>
                </div>
              </button>

              {/* Address Selection Dropdown Menu */}
              {isAddressOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-xl shadow-lg border border-border py-2.5 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      {t('deliveryAddresses') || 'Delivery Addresses'}
                    </span>
                    <Link
                      href="/profile/saved-addresses"
                      onClick={() => setIsAddressOpen(false)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t('manage') || 'Manage'}
                    </Link>
                  </div>

                  <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                    {userAddresses.length > 0 ? (
                      userAddresses.map((addr, idx) => {
                        const isSelected = activeAddress?.id === addr.id || (activeAddress?.label === addr.label && activeAddress?.address === addr.address);
                        return (
                          <button
                            key={addr.id || `addr-${idx}-${addr.label}`}
                            type="button"
                            onClick={() => {
                              setCheckoutAddressId(addr.id || addr.label);
                              setIsAddressOpen(false);
                            }}
                            className={`w-full flex items-start justify-between p-2.5 rounded-lg transition-colors text-left cursor-pointer min-h-[44px] ${isSelected
                                ? 'bg-surface-muted border border-border text-primary'
                                : 'hover:bg-surface-muted text-foreground'
                              }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-foreground">{addr.label}</span>
                                {addr.is_default && (
                                  <span className="text-xs bg-surface-muted text-primary px-1.5 py-0.5 rounded-full border border-border font-medium">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-foreground-muted line-clamp-2 mt-0.5">{addr.address}</p>
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
                          onClick={() => setIsAddressOpen(false)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Your First Address
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="px-3 pt-2 border-t border-border">
                    <Link
                      href="/profile/saved-addresses"
                      onClick={() => setIsAddressOpen(false)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary bg-surface-muted hover:bg-border rounded-lg transition-colors min-h-[44px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New Delivery Address
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart - only visible when user has items in cart */}
          {totalItems > 0 && (
            <Link
              href="/cart"
              className="flex flex-col items-center justify-center text-foreground hover:text-primary transition-colors relative group min-h-[44px] min-w-[44px] animate-in fade-in zoom-in-95 duration-200"
              aria-label="View Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
                <span className="absolute -top-2 -right-2.5 bg-primary text-on-primary text-xs font-semibold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                  {totalItems}
                </span>
              </div>
              <span className="text-xs font-medium mt-0.5">{t('cart') || 'Cart'}</span>
            </Link>
          )}

          {/* ── User Profile with Hover Dropdown ── */}
          <div
            ref={profileDropdownRef}
            onMouseEnter={handleProfileMouseEnter}
            onMouseLeave={handleProfileMouseLeave}
            className="relative"
          >
            <Link
              href={activeUser ? "/profile" : "/login"}
              className="flex flex-col items-center justify-center text-foreground hover:text-primary transition-colors group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-surface-muted flex items-center justify-center overflow-hidden border border-border group-hover:border-primary transition-colors shadow-2xs">
                <img
                  src={activeUser?.avatar_url || '/profile/profile.jpg'}
                  alt={activeUser?.name || "Profile"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/profile/profile.jpg';
                  }}
                />
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                <span className="text-xs font-medium text-foreground group-hover:text-primary whitespace-nowrap">
                  {activeUser ? (activeUser.name ? activeUser.name.split(' ')[0] : (t('account') || 'Account')) : (t('loginSignUp') || 'Login / Sign up')}
                </span>
                {activeUser && (
                  <ChevronDown className={`w-3 h-3 text-foreground-muted transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                )}
              </div>
            </Link>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-xl shadow-lg border border-border py-2 z-50 animate-in fade-in slide-in-from-top-1 divide-y divide-border">
                {activeUser ? (
                  <>
                    {/* User Profile Header */}
                    <div className="px-4 py-2.5 bg-surface-muted rounded-t-lg">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {activeUser.name || 'Gjanand Customer'}
                      </p>
                      <p className="text-xs text-foreground-muted truncate">
                        {activeUser.phone || activeUser.email || 'Logged In'}
                      </p>
                      {activeUser.role && activeUser.role !== 'customer' && (
                        <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 bg-primary text-on-primary rounded-full">
                          {activeUser.role}
                        </span>
                      )}
                    </div>

                    {/* Navigation Options */}
                    <div className="py-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-muted hover:text-primary transition-colors group"
                      >
                        <User className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors" />
                        <span>{t('profile') || 'Profile'}</span>
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-muted hover:text-primary transition-colors group"
                      >
                        <Package className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors" />
                        <div className="flex-1 flex items-center justify-between">
                          <span>{t('orders') || 'Orders'}</span>
                          <span className="text-xs text-foreground-muted font-normal">{t('trackAndHistory') || 'Track & History'}</span>
                        </div>
                      </Link>

                      <Link
                        href="/wishlist"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-muted hover:text-primary transition-colors group"
                      >
                        <Heart className="w-4 h-4 text-foreground-muted group-hover:text-error transition-colors" />
                        <div className="flex-1 flex items-center justify-between">
                          <span>{t('wishlist') || 'Wishlist'}</span>
                          {wishlist.length > 0 && (
                            <span className="bg-surface-muted text-foreground text-xs font-medium px-1.5 py-0.5 rounded-full border border-border">
                              {wishlist.length}
                            </span>
                          )}
                        </div>
                      </Link>

                      <Link
                        href="/profile/saved-addresses"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-foreground hover:bg-surface-muted hover:text-primary transition-colors group"
                      >
                        <MapPin className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors" />
                        <span>{t('savedAddresses') || 'Saved Addresses'}</span>
                      </Link>

                      {activeUser.role === 'seller' && (
                        <Link
                          href="/seller/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-primary bg-success-bg/60 hover:bg-success-bg/80 transition-colors"
                        >
                          <Store className="w-4 h-4 text-primary" />
                          <span>{t('sellerHub') || 'Seller Dashboard'}</span>
                        </Link>
                      )}

                      {activeUser.role === 'admin' && (
                        <Link
                          href="/admin/products"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50/60 hover:bg-purple-100/80 transition-colors"
                        >
                          <Store className="w-4 h-4 text-purple-700" />
                          <span>{t('adminPortal') || 'Admin Console'}</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout Option */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-error hover:bg-error-bg transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-error" />
                        <span>{t('logout') || 'Logout'}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 text-center">
                    <p className="text-xs font-bold text-foreground mb-1">Welcome to Gjanand Sarkar</p>
                    <p className="text-xs text-foreground-muted mb-3">Login to manage orders, wishlist & subscriptions</p>
                    <Link
                      href="/login"
                      onClick={() => setIsProfileOpen(false)}
                      className="block w-full py-2 bg-primary hover:bg-primary-fixed-dim text-on-primary text-xs font-bold rounded-xl transition-colors text-center"
                    >
                      Login / Sign Up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Search gets its own full-width row on phones, where there is no space
          for it beside the logo and the account actions. */}
      <div className="md:hidden px-4 pb-3 -mt-1">
        {searchForm}
      </div>
    </header>
  );
}

export function Header() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 w-full z-40 bg-surface border-b border-border/80 shadow-xs h-18 md:h-20" />
    }>
      <HeaderContent />
    </Suspense>
  );
}
