"use client";

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import React, { useEffect, Suspense, useRef } from 'react';

import { useStore } from '@/store/useStore';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const next = searchParams.get('redirect') || searchParams.get('next') || '/home';

  const isProcessing = React.useRef(false);

  useEffect(() => {
    let mounted = true;

    const executeCallback = async (session: any) => {
      // Skip if we've already processed this callback (prevent double execution)
      if (typeof window !== 'undefined' && sessionStorage.getItem('auth_callback_processed')) {
        router.replace(next);
        return;
      }

      if (isProcessing.current) return;
      isProcessing.current = true;

      try {
        let redirectTarget = next || '/home';

        // Sync with backend
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: session.access_token }),
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
              : (session.user?.user_metadata?.full_name || session.user?.user_metadata?.name || userProfile.email?.split('@')[0] || 'Customer');

            useStore.getState().setUser({
              id: userProfile.id,
              name: resolvedName,
              phone: userProfile.phone || '',
              email: userProfile.email || '',
              avatar_url: userProfile.avatar_url || session.user?.user_metadata?.avatar_url || session.user?.user_metadata?.picture || '',
              role: userProfile.role ?? 'customer',
              saved_addresses: userProfile.saved_addresses || [],
            });

            if (userProfile.role === 'admin' && (!next || next === '/home' || next === '/')) {
              redirectTarget = '/admin';
            }
          }
        }

        // Mark callback as processed to prevent loops
        sessionStorage.setItem('auth_callback_processed', 'true');
        
        // Direct redirect to intended target
        router.replace(redirectTarget);
      } catch (err) {
        console.error('Auth callback error:', err);
        router.replace('/login');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_IN' && session && mounted) {
        executeCallback(session);
      }
    });

    // Also check if already signed in (in case the event fired before we mounted)
    supabase.auth.getSession().then(({ data: { session }, error }: any) => {
      if (session && mounted) {
        executeCallback(session);
      } else if (error) {
        if (mounted) router.replace('/login');
      }
      // If no session and no error, we just wait for onAuthStateChange
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, next]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>Signing you in...</p>
        </div>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
