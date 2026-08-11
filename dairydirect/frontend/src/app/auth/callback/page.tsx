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

        // Sync with backend — send user profile data, not just the token
        const supaUser = session.user;
        const syncPayload = {
          id: supaUser.id,
          email: supaUser.email,
          name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || supaUser.email?.split('@')[0],
          avatar_url: supaUser.user_metadata?.avatar_url || supaUser.user_metadata?.picture,
          phone: supaUser.phone || supaUser.user_metadata?.phone,
          token: session.access_token,
        };

        // 1. Direct Supabase client profile & users table upsert
        try {
          await supabase.from('profiles').upsert({
            id: supaUser.id,
            email: supaUser.email,
            name: syncPayload.name,
            avatar_url: syncPayload.avatar_url,
            phone: syncPayload.phone || null,
            role: 'customer',
            loyalty_points: 100,
          }, { onConflict: 'id' });
        } catch (sbDirectErr) {
          console.warn('[AuthCallback] Direct Supabase profile notice:', sbDirectErr);
        }

        try {
          await supabase.from('users').upsert({
            id: supaUser.id,
            phone: syncPayload.phone || null,
            name: syncPayload.name,
            email: supaUser.email,
          }, { onConflict: 'id' });
        } catch (sbUsersErr) {
          console.warn('[AuthCallback] Direct Supabase users notice:', sbUsersErr);
        }

        // 2. Sync with Express backend on port 4000 if configured
        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          fetch(`${apiBase}/api/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncPayload),
          }).catch(() => {});
        } catch {}

        // 3. Sync via Next.js API Route
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncPayload),
        });

        if (res.ok) {
          const raw = await res.json();
          const userProfile = raw.profile || raw.user || raw.data?.profile || raw.data?.user;
          const accessToken = raw.token || raw.accessToken || raw.data?.token || raw.data?.accessToken;

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
