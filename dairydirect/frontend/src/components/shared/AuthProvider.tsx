'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { fetchTranslations } from '@/lib/api/translations';
import { mergeLocalCart } from '@/lib/api/cart';
import { getCart } from '@/lib/api/cart';
import type { Language } from '@/lib/i18n';
import type { DBProfile } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

/**
 * AuthProvider — mounts once at root layout.
 * Responsible for:
 *  1. Listening to Supabase auth state changes
 *  2. Fetching user profile and loading it into Zustand
 *  3. Merging local cart with DB cart on login
 *  4. Pre-loading translations for all 3 languages
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useStore((s) => s.setUser);
  const logout = useStore((s) => s.logout);
  const setAuthLoading = useStore((s) => s.setAuthLoading);
  const setTranslationsCache = useStore((s) => s.setTranslationsCache);
  const setCart = useStore((s) => s.setCart);
  const localCart = useStore((s) => s.cart);
  const translationsCache = useStore((s) => s.translationsCache);
  const initialized = useRef(false);

  // Load translations once (cache persists in Zustand → localStorage)
  useEffect(() => {
    const langs: Language[] = ['en', 'hi', 'gu'];
    langs.forEach(async (lang) => {
      // Skip if already cached with content
      if (Object.keys(translationsCache[lang] ?? {}).length > 0) return;
      const map = await fetchTranslations(lang);
      if (Object.keys(map).length > 0) {
        setTranslationsCache(lang, map);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth state listener mapped to Firebase
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    setAuthLoading(true);

    // Supabase listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session) {
        try {
          await hydrateUser(session.access_token);
        } catch (error) {
          logout();
        }
      } else {
        logout();
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function hydrateUser(token: string) {
    // Sync with generic API endpoint to ensure profile exists and is updated
    const res = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, type: 'supabase' })
    });
    
    if (!res.ok) {
       // Do not throw! If synchronization fails (e.g. database column missing), 
       // we simply fallback to basic Supabase payload to avoid forcing a logout loop.
       const { data: { user }, error } = await supabase.auth.getUser();
       if (user && !error) {
         setUser({
           id: user.id,
           name: '',
           phone: user.phone || '',
           email: user.email || '',
           avatar_url: '',
           role: 'customer'
         });
       }
       return;
    }
    
    const data = await res.json();
    const userProfile = data.user;
    
    setUser({ 
      id: userProfile.id, 
      name: userProfile.name ?? '', 
      phone: userProfile.phone || '', 
      email: userProfile.email || '', 
      avatar_url: userProfile.avatar_url || '',
      role: userProfile.role ?? 'customer' 
    });

    // Merge local cart into DB, then load DB cart
    if (localCart.length > 0) {
      await mergeLocalCart(
        userProfile.id,
        localCart.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        }))
      );
    }

    const dbCart = await getCart(userProfile.id);
    setCart(
      dbCart.map((item) => ({
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
      }))
    );
  }

  return <>{children}</>;
}
