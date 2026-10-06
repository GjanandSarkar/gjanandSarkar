'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { fetchTranslations } from '@/lib/api/translations';
import { mergeLocalCart, getCart } from '@/lib/api/cart';
import { getWishlist } from '@/lib/api/wishlist';
import { getUserAddresses } from '@/lib/api/addresses';
import type { Language } from '@/lib/i18n';

/**
 * `@supabase/supabase-js` is ~180KB of JavaScript. It used to be imported
 * statically here, and because AuthProvider wraps the entire app in the root
 * layout, that 180KB sat in the critical bundle of EVERY route — including
 * fully public pages (home, product, category, about) where no signed-in
 * session is involved at all.
 *
 * It is now loaded on demand. Two helpers below give us a single shared
 * promise so repeated calls never create a second client.
 */
let supabaseClientPromise: Promise<
  Awaited<ReturnType<typeof import('@/lib/supabase/client')['getSupabaseBrowserClient']>>
> | null = null;

function loadSupabase() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = import('@/lib/supabase/client').then((m) =>
      m.getSupabaseBrowserClient()
    );
  }
  return supabaseClientPromise;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useStore((s) => s.setUser);
  const logout = useStore((s) => s.logout);
  const setAuthLoading = useStore((s) => s.setAuthLoading);
  const setTranslationsCache = useStore((s) => s.setTranslationsCache);
  const setCart = useStore((s) => s.setCart);
  const setWishlist = useStore((s) => s.setWishlist);
  const localCart = useStore((s) => s.cart);
  const translationsCache = useStore((s) => s.translationsCache);
  
  const isHydrating = useRef(false);
  const hasInitialized = useRef(false);

  // Preload translations once in background (deferred so it doesn't block auth)
  useEffect(() => {
    const langs: Language[] = ['en', 'hi', 'gu'];
    const load = () => {
      langs.forEach(async (lang) => {
        if (Object.keys(translationsCache[lang] ?? {}).length > 0) return;
        try {
          const map = await fetchTranslations(lang);
          if (Object.keys(map).length > 0) {
            setTranslationsCache(lang, map);
          }
        } catch (err) {
          // Silently skip translation fetch errors
        }
      });
    };
    // Use idle callback to avoid competing with auth initialization
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(load, { timeout: 3000 });
    } else {
      setTimeout(load, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Supabase Auth listener (client loaded lazily — see loadSupabase above)
  useEffect(() => {
    setAuthLoading(true);

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const handleAuthEvent = async (event: any, session: any) => {
      if (event === 'INITIAL_SESSION') {
        if (session) {
          await hydrateUser(session.access_token);
        } else {
          setAuthLoading(false);
        }
        hasInitialized.current = true;
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        await hydrateUser(session.access_token);
        return;
      }

      if (event === 'TOKEN_REFRESHED' && session) {
        await hydrateUser(session.access_token);
        return;
      }

      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('auth_callback_processed');
        logout();
        setAuthLoading(false);
        return;
      }

      setAuthLoading(false);
    };

    loadSupabase()
      .then((supabase) => {
        if (cancelled) return;
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(handleAuthEvent);
        unsubscribe = () => subscription.unsubscribe();
      })
      .catch((err) => {
        console.warn('Auth init notice:', err);
        setAuthLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function hydrateUser(token: string) {
    if (isHydrating.current) return;
    isHydrating.current = true;

    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type: 'supabase' }),
      });

      if (res.ok) {
        const raw = await res.json();
        const userProfile = raw.user || raw.data?.user;
        const accessToken = raw.data?.accessToken || raw.accessToken;
        if (accessToken) {
          try {
            document.cookie = `gs_access_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
          } catch {}
        }
        if (userProfile) {
          const resolvedName = (userProfile.name && userProfile.name.trim())
            ? userProfile.name.trim()
            : (userProfile.email ? userProfile.email.split('@')[0] : (userProfile.phone ? `User (${userProfile.phone.slice(-4)})` : 'Customer'));

          setUser({
            id: userProfile.id,
            name: resolvedName,
            phone: userProfile.phone || '',
            email: userProfile.email || '',
            avatar_url: userProfile.avatar_url || '',
            role: userProfile.role ?? 'customer',
            saved_addresses: userProfile.saved_addresses || [],
          });

          // Parallel fetch cart, wishlist, and addresses — faster than sequential .then() waterfall
          const [dbCart, wishlistItems, addresses] = await Promise.allSettled([
            getCart(userProfile.id),
            getWishlist(userProfile.id),
            getUserAddresses(userProfile.id),
          ]);

          // Apply cart
          if (dbCart.status === 'fulfilled' && dbCart.value && dbCart.value.length > 0) {
            setCart(
              dbCart.value.map((item) => ({
                productId: item.product_id,
                variantId: item.variant_id,
                quantity: item.quantity,
              }))
            );
          }

          // Apply wishlist
          if (wishlistItems.status === 'fulfilled' && wishlistItems.value) {
            setWishlist(wishlistItems.value);
          }

          // Apply addresses
          if (addresses.status === 'fulfilled' && addresses.value && addresses.value.length > 0) {
            setUser({
              id: userProfile.id,
              name: resolvedName,
              phone: userProfile.phone || '',
              email: userProfile.email || '',
              avatar_url: userProfile.avatar_url || '',
              role: userProfile.role ?? 'customer',
              saved_addresses: addresses.value.map(a => ({ label: a.label, address: a.address })),
            });
          }

          // Merge any local cart items into DB in background (non-blocking)
          if (localCart.length > 0) {
            mergeLocalCart(
              userProfile.id,
              localCart.map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
              }))
            ).catch(() => {});
          }

          return;
        }
      }

      // Fallback if sync API failed to return profile
      const supabase = await loadSupabase();
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) {
        const fallbackName = sbUser.user_metadata?.full_name 
          || sbUser.user_metadata?.name 
          || sbUser.user_metadata?.display_name 
          || (sbUser.email ? sbUser.email.split('@')[0] : (sbUser.phone ? `User (${sbUser.phone.slice(-4)})` : 'Customer'));

        setUser({
          id: sbUser.id,
          name: fallbackName,
          phone: sbUser.phone || '',
          email: sbUser.email || '',
          avatar_url: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || sbUser.user_metadata?.image || '',
          role: 'customer',
          saved_addresses: [],
        });

        getWishlist(sbUser.id).then((items) => {
          if (items) setWishlist(items);
        }).catch(() => {});

        getCart(sbUser.id).then((dbCart) => {
          if (dbCart && dbCart.length > 0) {
            setCart(
              dbCart.map((item) => ({
                productId: item.product_id,
                variantId: item.variant_id,
                quantity: item.quantity,
              }))
            );
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Auth hydration notice:', err);
    } finally {
      isHydrating.current = false;
      setAuthLoading(false);
    }
  }

  return <>{children}</>;
}
