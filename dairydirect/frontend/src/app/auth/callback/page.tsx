"use client";

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useEffect, Suspense } from 'react';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const next = searchParams.get('next') || '/home';

  useEffect(() => {
    const handleCallback = async () => {
      // Skip if we've already processed this callback (prevent double execution)
      if (typeof window !== 'undefined' && sessionStorage.getItem('auth_callback_processed')) {
        router.replace(next);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          router.replace('/login');
          return;
        }

        // Check if user has saved addresses - need to fetch this
        const { data: addresses, error: addrError } = await supabase
          .from('user_addresses')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1);

        // Determine redirect target based on whether onboarding is needed
        let redirectTarget = next;
        
        if (addrError || !addresses || addresses.length === 0) {
          // User has no addresses, redirect to onboarding but preserve the final destination
          redirectTarget = '/onboarding/address?return_to=' + encodeURIComponent(next);
        }

        // Sync with backend
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: session.access_token }),
        });

        if (!res.ok) {
          console.error('Sync failed:', await res.text());
        }

        // Mark callback as processed to prevent loops
        sessionStorage.setItem('auth_callback_processed', 'true');
        
        // Single redirect only
        router.replace(redirectTarget);
      } catch (err) {
        console.error('Auth callback error:', err);
        router.replace('/login');
      }
    };

    handleCallback();
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
