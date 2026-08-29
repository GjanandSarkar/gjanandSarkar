'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { fetchTranslations } from '@/lib/api/translations';
import { mergeLocalCart, getCart } from '@/lib/api/cart';
import { getWishlist } from '@/lib/api/wishlist';
import { getUserAddresses } from '@/lib/api/addresses';
import type { Language } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

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

  // Preload translations once in background
  useEffect(() => {
    const langs: Language[] = ['en', 'hi', 'gu'];
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Supabase Auth listener
  useEffect(() => {
    setAuthLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
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
    });

    return () => {
      subscription.unsubscribe();
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

          // Sync cart from Database via Backend API
          const cart = localCart;
          if (cart.length > 0) {
            mergeLocalCart(
              userProfile.id,
              cart.map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
              }))
            ).catch(() => {});
          }

          getCart(userProfile.id).then((dbCart) => {
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

          // Sync wishlist from Database via Backend API
          getWishlist(userProfile.id).then((items) => {
            if (items) setWishlist(items);
          }).catch(() => {});

          // Sync addresses from Database via Backend API
          getUserAddresses(userProfile.id).then((addresses) => {
            if (addresses && addresses.length > 0) {
              setUser({
                id: userProfile.id,
                name: resolvedName,
                phone: userProfile.phone || '',
                email: userProfile.email || '',
                avatar_url: userProfile.avatar_url || '',
                role: userProfile.role ?? 'customer',
                saved_addresses: addresses.map(a => ({ label: a.label, address: a.address })),
              });
            }
          }).catch(() => {});

          return;
        }
      }

      // Fallback if sync API failed to return profile
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
