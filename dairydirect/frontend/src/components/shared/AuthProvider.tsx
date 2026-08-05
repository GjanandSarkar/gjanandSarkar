'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { fetchTranslations } from '@/lib/api/translations';
import { mergeLocalCart, getCart } from '@/lib/api/cart';
import type { Language } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useStore((s) => s.setUser);
  const logout = useStore((s) => s.logout);
  const setAuthLoading = useStore((s) => s.setAuthLoading);
  const setTranslationsCache = useStore((s) => s.setTranslationsCache);
  const setCart = useStore((s) => s.setCart);
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
    // Always start loading = true on mount so guards wait
    setAuthLoading(true);

    // onAuthStateChange fires INITIAL_SESSION immediately on mount with the
    // persisted session (if any). This is the correct hook for refresh persistence.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'INITIAL_SESSION') {
        // First load / refresh: if session exists, hydrate user
        if (session) {
          await hydrateUser(session.access_token);
        } else {
          // No session at all — user is genuinely not logged in
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
        // Token was silently refreshed; re-hydrate in background
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
        const data = await res.json();
        const userProfile = data.user;
        if (userProfile) {
          setUser({
            id: userProfile.id,
            name: userProfile.name ?? '',
            phone: userProfile.phone || '',
            email: userProfile.email || '',
            avatar_url: userProfile.avatar_url || '',
            role: userProfile.role ?? 'customer',
            saved_addresses: userProfile.saved_addresses || [],
          });

          // Sync cart in background
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
        }
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
