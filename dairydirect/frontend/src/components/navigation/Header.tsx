"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
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
import { getUserAddresses, type UserAddress } from '@/lib/api/addresses';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);

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
            user.saved_addresses.map((a, i) => ({
              id: `saved-${i}`,
              user_id: user.id,
              label: a.label,
              address: a.address,
              lat: null,
              lng: null,
              is_default: i === 0,
              created_at: new Date().toISOString(),
            }))
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
    router.push(`/products${queryStr ? `?${queryStr}` : ''}`);
  };

  // Find active selected address
  const activeAddress = userAddresses.find(a => a.id === checkoutAddressId || a.label === checkoutAddressId)
    || userAddresses.find(a => a.is_default)
    || userAddresses[0]
    || (user?.address ? { id: 'default-profile', label: 'Default', address: user.address, user_id: user.id, lat: null, lng: null, is_default: true, created_at: '' } : null);

  return (
    <header className="sticky top-0 w-full z-40 bg-white border-b border-gray-200/80 shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-18 md:h-20 flex items-center justify-between gap-4 md:gap-8">

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
              <span className="text-xl md:text-2xl font-black tracking-tight leading-none">
                <span className="text-[#0f3e26]">Gjanand</span>
              </span>
              <span className="text-[10px] md:text-[11px] tracking-[0.2em] font-black text-[#c88a23] uppercase text-right leading-none mt-0.5">
                SARKAR
              </span>
            </div>
          </div>
        </Link>

        {/* ── Search Bar ── */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-2xl mx-auto relative flex items-center bg-gray-50/80 border border-gray-300 rounded-lg overflow-visible focus-within:border-[#c88a23] focus-within:ring-1 focus-within:ring-[#c88a23] transition-all"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for products, brands and more..."
            className="flex-1 min-w-0 px-4 py-2.5 text-sm bg-transparent text-gray-800 placeholder-gray-400 outline-none rounded-l-lg"
          />

          {/* Golden Search Button */}
          <button
            type="submit"
            className="bg-[#c88a23] hover:bg-[#b0781c] text-white px-4 py-2.5 flex items-center justify-center transition-colors shrink-0 rounded-r-lg"
            aria-label="Search"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        {/* ── Right Quick Actions ── */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0">

          {/* Become Seller / Seller Portal */}
          <Link
            href={user?.role === 'seller' ? "/seller/dashboard" : user?.role === 'admin' ? "/admin/products" : "/become-seller"}
            className="hidden lg:flex flex-col items-center justify-center text-gray-700 hover:text-[#0f3e26] transition-colors group"
          >
            <Store className="w-5 h-5 text-gray-600 group-hover:text-[#0f3e26] transition-colors" />
            <span className="text-[11px] font-semibold mt-0.5 whitespace-nowrap">
              {user?.role === 'seller' ? 'Seller Hub' : user?.role === 'admin' ? 'Admin Panel' : 'Become Seller'}
            </span>
          </Link>

          {/* ── Delivery Address Selection (ONLY VISIBLE WHEN LOGGED IN) ── */}
          {user && (
            <div
              ref={addressDropdownRef}
              onMouseEnter={handleAddressMouseEnter}
              onMouseLeave={handleAddressMouseLeave}
              className="relative hidden sm:block"
            >
              <button
                type="button"
                onClick={() => setIsAddressOpen(!isAddressOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100/80 transition-colors text-left group cursor-pointer border border-transparent hover:border-gray-200"
                aria-label="Select delivery address"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0f3e26] flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
                  <MapPin className="w-4 h-4 text-[#0f3e26]" />
                </div>
                <div className="flex flex-col max-w-[130px] lg:max-w-[170px]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                    Deliver to {user.name ? user.name.split(' ')[0] : 'You'}
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isAddressOpen ? 'rotate-180' : ''}`} />
                  </span>
                  <span className="text-xs font-bold text-gray-900 truncate">
                    {activeAddress ? `${activeAddress.label}: ${activeAddress.address}` : 'Select Address'}
                  </span>
                </div>
              </button>

              {/* Address Selection Dropdown Menu */}
              {isAddressOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0f3e26]" />
                      Delivery Addresses
                    </span>
                    <Link
                      href="/profile/saved-addresses"
                      onClick={() => setIsAddressOpen(false)}
                      className="text-[11px] font-bold text-[#c88a23] hover:underline"
                    >
                      Manage
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
                            className={`w-full flex items-start justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer ${isSelected
                                ? 'bg-emerald-50/90 border border-emerald-200 text-[#0f3e26]'
                                : 'hover:bg-gray-50 text-gray-700'
                              }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-900">{addr.label}</span>
                                {addr.is_default && (
                                  <span className="text-[9px] bg-emerald-100 text-[#0f3e26] px-1.5 py-0.2 rounded font-bold">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{addr.address}</p>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#0f3e26] shrink-0 mt-1" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-xs text-gray-500">No saved addresses found</p>
                        <Link
                          href="/profile/saved-addresses"
                          onClick={() => setIsAddressOpen(false)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#0f3e26] hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Your First Address
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="px-3 pt-2 border-t border-gray-100">
                    <Link
                      href="/profile/saved-addresses"
                      onClick={() => setIsAddressOpen(false)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#0f3e26] bg-emerald-50 hover:bg-emerald-100/80 rounded-xl transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New Delivery Address
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart */}
          <Link
            href="/cart"
            className="flex flex-col items-center justify-center text-gray-700 hover:text-[#0f3e26] transition-colors relative group"
            aria-label="View Cart"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:text-[#0f3e26] transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-[#c88a23] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[11px] font-semibold mt-0.5">Cart</span>
          </Link>

          {/* ── User Profile with Hover Dropdown ── */}
          <div
            ref={profileDropdownRef}
            onMouseEnter={handleProfileMouseEnter}
            onMouseLeave={handleProfileMouseLeave}
            className="relative"
          >
            <Link
              href={user ? "/profile" : "/login"}
              className="flex flex-col items-center justify-center text-gray-700 hover:text-[#0f3e26] transition-colors group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 group-hover:border-[#0f3e26] transition-colors shadow-2xs">
                <img
                  src={user?.avatar_url || '/profile/profile.jpg'}
                  alt={user?.name || "Profile"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/profile/profile.jpg';
                  }}
                />
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                <span className="text-[11px] font-semibold text-gray-800 group-hover:text-[#0f3e26] whitespace-nowrap">
                  {user ? (user.name ? user.name.split(' ')[0] : 'Account') : 'Login / Sign up'}
                </span>
                {user && (
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                )}
              </div>
            </Link>

            {/* Profile Dropdown Menu (on hover / click) */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 divide-y divide-gray-100">
                {user ? (
                  <>
                    {/* User Profile Header */}
                    <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-50/70 to-amber-50/40 rounded-t-xl">
                      <p className="text-xs font-black text-gray-900 truncate">
                        {user.name || 'Gjanand Customer'}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {user.phone || user.email || 'Logged In'}
                      </p>
                      {user.role && user.role !== 'customer' && (
                        <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#0f3e26] text-white rounded-full">
                          {user.role}
                        </span>
                      )}
                    </div>

                    {/* Navigation Options */}
                    <div className="py-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0f3e26] transition-colors group"
                      >
                        <User className="w-4 h-4 text-gray-400 group-hover:text-[#0f3e26] transition-colors" />
                        <span>Profile</span>
                      </Link>

                      <Link
                        href="/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0f3e26] transition-colors group"
                      >
                        <Package className="w-4 h-4 text-gray-400 group-hover:text-[#0f3e26] transition-colors" />
                        <div className="flex-1 flex items-center justify-between">
                          <span>Orders</span>
                          <span className="text-[10px] text-gray-400 font-normal">Track & History</span>
                        </div>
                      </Link>

                      <Link
                        href="/wishlist"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0f3e26] transition-colors group"
                      >
                        <Heart className="w-4 h-4 text-gray-400 group-hover:text-rose-600 transition-colors" />
                        <div className="flex-1 flex items-center justify-between">
                          <span>Wishlist</span>
                          {wishlist.length > 0 && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {wishlist.length}
                            </span>
                          )}
                        </div>
                      </Link>

                      <Link
                        href="/profile/saved-addresses"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0f3e26] transition-colors group"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 group-hover:text-[#0f3e26] transition-colors" />
                        <span>Saved Addresses</span>
                      </Link>

                      <Link
                        href="/subscribe"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0f3e26] transition-colors group"
                      >
                        <Sparkles className="w-4 h-4 text-[#c88a23]" />
                        <span>Subscriptions</span>
                      </Link>

                      {user.role === 'seller' && (
                        <Link
                          href="/seller/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-[#0f3e26] bg-emerald-50/60 hover:bg-emerald-100/80 transition-colors"
                        >
                          <Store className="w-4 h-4 text-[#0f3e26]" />
                          <span>Seller Dashboard</span>
                        </Link>
                      )}

                      {user.role === 'admin' && (
                        <Link
                          href="/admin/products"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50/60 hover:bg-purple-100/80 transition-colors"
                        >
                          <Store className="w-4 h-4 text-purple-700" />
                          <span>Admin Console</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout Option */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 text-center">
                    <p className="text-xs font-bold text-gray-900 mb-1">Welcome to Gjanand Sarkar</p>
                    <p className="text-[11px] text-gray-500 mb-3">Login to manage orders, wishlist & subscriptions</p>
                    <Link
                      href="/login"
                      onClick={() => setIsProfileOpen(false)}
                      className="block w-full py-2 bg-[#0f3e26] hover:bg-[#0a2c1b] text-white text-xs font-bold rounded-xl transition-colors text-center"
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
    </header>
  );
}

export function Header() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 w-full z-40 bg-white border-b border-gray-200/80 shadow-xs h-18 md:h-20" />
    }>
      <HeaderContent />
    </Suspense>
  );
}
