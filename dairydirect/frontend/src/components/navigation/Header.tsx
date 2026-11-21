"use client";

<<<<<<< HEAD
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, MapPin, Search, ShoppingCart, User, X, LogOut, Package, Heart, Store, Shield } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useCartDetails } from '@/hooks/useCartDetails';
import { getUserAddresses, type UserAddress } from '@/lib/api/addresses';

/**
 * Storefront header — one job per element.
 *
 * Modelled on the quick-commerce grammar customers already know: brand,
 * delivery promise + address, search, account, cart. Nothing else lives here.
 * The language switcher, theme toggle, seller portal link, trust badges and
 * wishlist moved into the account menu / footer so the first screen belongs to
 * the products.
 *
 * Density notes:
 *  - 60px tall on desktop, 56px + a 48px search row on phones.
 *  - Text-only wordmark: the old 263 KB PNG logo was the largest image on the
 *    critical path and pushed the search box down.
 *  - Search is a quiet grey field with no coloured submit button; Enter and the
 *    leading icon both submit.
 */
function HeaderInner() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const checkoutAddressId = useStore((s) => s.checkoutAddressId);
  const setCheckoutAddressId = useStore((s) => s.setCheckoutAddressId);
  const { totalItems } = useCartDetails();

  const [mounted, setMounted] = useState(false);
  const [term, setTerm] = useState('');
  const [addressOpen, setAddressOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const addressRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Read the term from the URL after mount rather than with useSearchParams:
  // that hook suspends the whole header on static pages, so the bar only
  // appeared once the JS bundle had downloaded — on a slow phone, a blank
  // strip above the fold.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('search') || params.get('q');
    if (q) setTerm(q);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setAddresses([]);
      return;
    }
    let alive = true;
    getUserAddresses(user.id)
      .then((rows) => {
        if (alive && rows?.length) setAddresses(rows);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (addressRef.current && !addressRef.current.contains(event.target as Node)) setAddressOpen(false);
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const activeUser = mounted ? user : null;
  const activeAddress =
    addresses.find((a) => a.id === checkoutAddressId) ?? addresses.find((a) => a.is_default) ?? addresses[0] ?? null;

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = term.trim();
    router.push(q ? `/search?search=${encodeURIComponent(q)}` : '/products');
  }

  async function handleLogout() {
    setAccountOpen(false);
    try {
      const { logout: apiLogout } = await import('@/lib/api/auth');
      await apiLogout();
    } catch {}
    logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-surface border-b border-border">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        {/* ── Row 1 ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 md:gap-6 h-14 md:h-16">
          <Link href="/home" className="shrink-0 leading-none" aria-label="Gjanand Sarkar home">
            <span className="block text-[21px] md:text-[23px] font-extrabold tracking-[-0.03em] text-primary">
              Gjanand
            </span>
            <span className="hidden sm:block text-[9px] font-bold tracking-[0.22em] text-foreground-muted mt-0.5">
              SARKAR
            </span>
          </Link>

          {/* Delivery promise + address */}
          <div ref={addressRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => (activeUser ? setAddressOpen((v) => !v) : router.push('/login?redirect=%2Fhome'))}
              className="flex flex-col items-start justify-center max-w-[150px] sm:max-w-[210px] text-left min-h-[44px] rounded-lg px-1 hover:bg-surface-muted transition-colors"
              aria-haspopup={activeUser ? 'dialog' : undefined}
              aria-expanded={activeUser ? addressOpen : undefined}
            >
              <span className="text-[11px] font-bold text-primary leading-none">Before 8 AM</span>
              <span className="flex items-center gap-0.5 text-[12px] font-semibold text-foreground leading-tight mt-1 truncate">
                <MapPin className="w-3 h-3 shrink-0 text-foreground-muted" aria-hidden />
                {activeAddress ? activeAddress.label : activeUser ? 'Add address' : 'Set location'}
                <ChevronDown className="w-3 h-3 shrink-0 text-foreground-muted" aria-hidden />
              </span>
            </button>

            {addressOpen && activeUser && (
              <div className="absolute left-0 top-full mt-2 w-[300px] rounded-xl border border-border bg-surface shadow-lg p-2 z-50">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">Deliver to</span>
                  <Link href="/profile/saved-addresses" className="text-[11px] font-bold text-primary hover:underline">
                    Manage
                  </Link>
                </div>
                {addresses.length === 0 ? (
                  <p className="px-2 py-3 text-[12px] text-foreground-muted">
                    No saved address yet.{' '}
                    <Link href="/profile/saved-addresses" className="font-bold text-primary hover:underline">
                      Add one
                    </Link>
                  </p>
                ) : (
                  addresses.map((address) => {
                    const selected = address.id === activeAddress?.id;
                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => {
                          setCheckoutAddressId(address.id);
                          setAddressOpen(false);
                        }}
                        className={`w-full text-left rounded-lg px-2 py-2 hover:bg-surface-muted ${
                          selected ? 'bg-surface-muted' : ''
                        }`}
                      >
                        <span className="block text-[12px] font-bold text-foreground">{address.label}</span>
                        <span className="block text-[11px] text-foreground-muted line-clamp-1">{address.address}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Search — inline on md+, second row on phones */}
          <form onSubmit={submitSearch} role="search" className="hidden md:block flex-1 max-w-[640px]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none"
                aria-hidden
              />
              <input
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search milk, curd, paneer, ghee"
                aria-label="Search products"
                className="w-full h-10 rounded-[10px] bg-surface-muted pl-9 pr-3 text-[13px] font-medium text-foreground placeholder:text-foreground-muted outline-none border border-transparent focus:border-primary focus:bg-surface"
              />
            </div>
          </form>

          {/* Account + cart */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-1.5 min-h-[44px] px-2 rounded-lg text-foreground hover:bg-surface-muted"
                aria-label="Account"
                aria-expanded={accountOpen}
              >
                <User className="w-[18px] h-[18px]" aria-hidden />
                <span className="hidden lg:inline text-[12px] font-semibold">
                  {activeUser ? activeUser.name?.split(' ')[0] || 'Account' : 'Login'}
                </span>
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-surface shadow-lg p-1.5 z-50">
                  {activeUser ? (
                    <>
                      <div className="px-2.5 py-2">
                        <p className="text-[13px] font-bold text-foreground truncate">{activeUser.name || 'My account'}</p>
                        <p className="text-[11px] text-foreground-muted truncate">{activeUser.phone || activeUser.email}</p>
                      </div>
                      <MenuLink href="/profile" icon={<User className="w-4 h-4" aria-hidden />} label="Profile" onNavigate={() => setAccountOpen(false)} />
                      <MenuLink href="/orders" icon={<Package className="w-4 h-4" aria-hidden />} label="Orders" onNavigate={() => setAccountOpen(false)} />
                      <MenuLink href="/subscribe" icon={<Heart className="w-4 h-4" aria-hidden />} label="My milk plan" onNavigate={() => setAccountOpen(false)} />
                      {activeUser.role === 'seller' && (
                        <MenuLink href="/seller/dashboard" icon={<Store className="w-4 h-4" aria-hidden />} label="Seller hub" onNavigate={() => setAccountOpen(false)} />
                      )}
                      {activeUser.role === 'admin' && (
                        <MenuLink href="/admin" icon={<Shield className="w-4 h-4" aria-hidden />} label="Admin console" onNavigate={() => setAccountOpen(false)} />
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-foreground hover:bg-surface-muted"
                      >
                        <LogOut className="w-4 h-4" aria-hidden />
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="px-2.5 py-2 text-[12px] text-foreground-muted">Sign in to order and track deliveries.</p>
                      <Link
                        href="/login"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg bg-primary px-3 py-2 text-center text-[12px] font-bold text-on-primary hover:bg-primary-hover"
                      >
                        Login
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/cart"
              className="flex items-center gap-1.5 min-h-[44px] px-2 rounded-lg text-foreground hover:bg-surface-muted relative"
              aria-label={`Cart, ${totalItems} items`}
            >
              <ShoppingCart className="w-[18px] h-[18px]" aria-hidden />
              <span className="hidden lg:inline text-[12px] font-semibold">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 right-0 min-w-[16px] h-4 px-1 rounded-full bg-primary text-on-primary text-[9px] font-extrabold grid place-items-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ── Row 2 (phones): search ─────────────────────────────────────── */}
        <form onSubmit={submitSearch} role="search" className="md:hidden pb-2.5">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search milk, curd, paneer, ghee"
              aria-label="Search products"
              className="w-full h-10 rounded-[10px] bg-surface-muted pl-9 pr-9 text-[13px] font-medium text-foreground placeholder:text-foreground-muted outline-none border border-transparent focus:border-primary focus:bg-surface"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full text-foreground-muted hover:bg-surface"
              >
                <X className="w-3.5 h-3.5" aria-hidden />
              </button>
            )}
          </div>
        </form>
      </div>
    </header>
  );
}
=======
import React, { Suspense } from 'react';
import { HeaderBar } from './HeaderBar';
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

function MenuLink({
  href,
  icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onNavigate: () => void;
}) {
  return (
<<<<<<< HEAD
    <Link
      href={href}
      onClick={onNavigate}
      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-foreground hover:bg-surface-muted"
    >
      {icon}
      {label}
    </Link>
  );
}

export { HeaderInner as Header };
=======
    <Suspense
      fallback={
        <header className="sticky top-0 w-full z-40 bg-surface border-b border-border shadow-xs h-[104px] md:h-[72px]" />
      }
    >
      <HeaderBar />
    </Suspense>
  );
}

export { HeaderBar };
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
