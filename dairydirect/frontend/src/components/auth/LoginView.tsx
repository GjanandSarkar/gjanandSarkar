"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  User, 
  Mail, 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  Store, 
  ArrowRight,
  CheckCircle2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { getURL } from '@/lib/utils';
import Link from 'next/link';

function LoginScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useStore((s) => s.setUser);
  const setSellerStore = useStore((s) => s.setSellerStore);

  // Read both 'redirect' and 'next' parameters
  const redirectUrl = searchParams.get('redirect') || searchParams.get('next') || '/home';
  // Prevent redirect loops to login page itself
  const nextParam = (redirectUrl.startsWith('/login') || redirectUrl.startsWith('/auth/login')) ? '/home' : redirectUrl;

  const [mode, setMode] = useState<'password' | 'quick'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Handle Email/Password Login & Sign Up ─────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const displayName = name.trim() || email.split('@')[0];
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: displayName,
              full_name: displayName,
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          let userProfile: any = null;
          const syncPayload = {
            id: data.user.id,
            email: data.user.email || email,
            name: displayName,
            role: 'customer',
            token: data.session?.access_token,
          };

          // 1. Sync & persist user to database profiles table via Next.js API
          try {
            const syncRes = await fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(syncPayload),
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              userProfile = syncData.profile || syncData.user || syncData.data?.user;
            }
          } catch (syncErr) {
            console.warn('[LoginView] Next.js API sync notice during signup:', syncErr);
          }

          // 2. Sync to Express Backend on port 4000 if configured
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            fetch(`${apiBase}/api/auth/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(syncPayload),
            }).catch(() => {});
          } catch {}

          // 3. Client-side fallback to direct Supabase profile & users table
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: data.user.email || email,
              name: displayName,
              role: 'customer',
              loyalty_points: 100,
            }, { onConflict: 'id' });
          } catch (sbErr) {
            console.warn('[LoginView] Direct Supabase profile upsert notice:', sbErr);
          }

          try {
            await supabase.from('users').upsert({
              id: data.user.id,
              phone: data.user.phone || null,
              name: displayName,
              email: data.user.email || email,
            }, { onConflict: 'id' });
          } catch (sbUsersErr) {
            console.warn('[LoginView] Direct Supabase users table upsert notice:', sbUsersErr);
          }

          setUser({
            id: userProfile?.id || data.user.id,
            name: userProfile?.name || displayName,
            email: userProfile?.email || data.user.email || email,
            phone: userProfile?.phone || '',
            avatar_url: userProfile?.avatar_url || '',
            role: userProfile?.role || 'customer',
            saved_addresses: userProfile?.saved_addresses || [],
          });

          setSuccessMsg('Account created successfully! Redirecting...');
          setTimeout(() => router.replace(nextParam), 500);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          const isAdmin = email.toLowerCase().includes('admin') || (process.env.ADMIN_EMAILS || '').includes(email.toLowerCase());
          const displayName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split('@')[0];

          let userProfile: any = null;

          // 1. Sync & retrieve full profile from database
          try {
            const syncRes = await fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: data.user.id,
                email: data.user.email || email,
                name: displayName,
                role: isAdmin ? 'admin' : 'customer',
                token: data.session?.access_token,
              }),
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              userProfile = syncData.profile || syncData.user || syncData.data?.user;
            }
          } catch (syncErr) {
            console.warn('[LoginView] API sync notice during login:', syncErr);
          }

          // 2. Client-side fallback to direct Supabase profile & users table
          try {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .maybeSingle();

            if (!existingProfile) {
              const { data: created } = await supabase.from('profiles').upsert({
                id: data.user.id,
                email: data.user.email || email,
                name: displayName,
                role: isAdmin ? 'admin' : 'customer',
              }, { onConflict: 'id' }).select().single();
              if (created && !userProfile) userProfile = created;
            } else if (existingProfile && !userProfile) {
              userProfile = existingProfile;
            }
          } catch (sbErr) {
            console.warn('[LoginView] Supabase profile check notice:', sbErr);
          }

          try {
            await supabase.from('users').upsert({
              id: data.user.id,
              phone: data.user.phone || null,
              name: displayName,
              email: data.user.email || email,
            }, { onConflict: 'id' });
          } catch (sbUsersErr) {
            console.warn('[LoginView] Supabase users check notice:', sbUsersErr);
          }

          const finalRole = userProfile?.role || (isAdmin ? 'admin' : 'customer');

          setUser({
            id: userProfile?.id || data.user.id,
            name: userProfile?.name || displayName,
            email: userProfile?.email || data.user.email || email,
            phone: userProfile?.phone || '',
            avatar_url: userProfile?.avatar_url || '',
            role: finalRole,
            saved_addresses: userProfile?.saved_addresses || [],
          });

          setSuccessMsg('Signed in successfully! Redirecting...');
          setTimeout(() => router.replace(finalRole === 'admin' ? '/admin' : nextParam), 400);
        }
      }
    } catch (err: any) {
      console.error('[LoginView] Auth error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handle Google OAuth ──────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getURL()}/auth/callback?redirect=${encodeURIComponent(nextParam)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to initialize Google Sign-in.');
      setIsLoading(false);
    }
  };

  // ── Fast Instant Demo Access (Zero Wait / No Network Lag) ───
  const handleQuickLogin = async (role: 'customer' | 'admin' | 'seller') => {
    setIsLoading(true);
    
    let demoPayload: any = null;
    let targetUrl = nextParam;

    if (role === 'admin') {
      demoPayload = {
        id: 'admin-demo-user-id',
        name: 'Gjanand Sarkar Admin',
        email: 'admin@gjanandsarkar.com',
        phone: '+91 98765 43210',
        role: 'admin',
      };
      targetUrl = '/admin';
    } else if (role === 'seller') {
      demoPayload = {
        id: 'seller-demo-user-id',
        name: 'Gir Organic Farms',
        email: 'seller@gjanandsarkar.com',
        phone: '+91 98234 56789',
        role: 'seller',
      };
      targetUrl = '/seller/dashboard';
    } else {
      demoPayload = {
        id: 'customer-demo-user-id',
        name: 'Rajesh Sharma',
        email: 'customer@gjanandsarkar.com',
        phone: '+91 91234 56789',
        role: 'customer',
        address: 'Sector 14, Gandhinagar, Gujarat',
        saved_addresses: [
          { label: 'Home', address: 'A-402, Royal Palms, Gandhinagar, Gujarat - 382010' },
          { label: 'Office', address: 'Block C, Infocity, Gandhinagar, Gujarat - 382007' }
        ]
      };
    }

    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoPayload),
      });

      if (res.ok) {
        const raw = await res.json();
        const accessToken = raw.data?.accessToken || raw.accessToken || raw.token;
        if (accessToken) {
          try {
            document.cookie = `gs_access_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[handleQuickLogin] sync notice:', err);
    }

    setUser(demoPayload);
    useStore.getState().setAuthLoading(false);
    sessionStorage.setItem('auth_callback_processed', 'true');

    if (role === 'seller') {
      setSellerStore({
        id: 'store-demo-001',
        user_id: 'seller-demo-user-id',
        store_name: 'Gir Organic & Vedic Dairy',
        slug: 'gir-organic-dairy',
        state: 'Gujarat',
        plan: 'growth',
        commission_rate: 5,
        status: 'active',
        total_revenue: 284500
      });
    }

    setIsLoading(false);
    router.replace(targetUrl);
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fafaf8] relative overflow-hidden" suppressHydrationWarning>
      
      {/* Decorative Palace Glow Background */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#0f3e26]/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#c88a23]/15 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <Link href="/home" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-12 h-12 rounded-2xl bg-[#0f3e26] flex items-center justify-center shadow-lg border border-[#c88a23]/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl tracking-tight">GS</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-2xl font-black text-[#0f3e26] tracking-tight leading-none">
                Gjanand<span className="text-[#c88a23]">.</span>
              </span>
              <span className="text-[10px] tracking-[0.25em] font-extrabold text-[#c88a23] uppercase mt-0.5">
                SARKAR
              </span>
            </div>
          </Link>
          <p className="text-xs text-gray-500 font-medium">
            India's Purest Heritage & Artisanal Marketplace
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xl p-6 sm:p-8 backdrop-blur-sm">
          
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100/80 rounded-xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode('password'); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'password'
                  ? 'bg-white text-[#0f3e26] shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sign In / Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setMode('quick'); setError(''); }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                mode === 'quick'
                  ? 'bg-white text-[#c88a23] shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c88a23]" />
              <span>Instant Access</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#0f3e26] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'password' ? (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      required={isSignUp}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#0f3e26] hover:bg-[#144f31] text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{isSignUp ? 'Create My Account' : 'Sign In'}</span>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-gray-400 text-[10px] uppercase font-bold tracking-wider">or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="text-xs font-bold text-[#c88a23] hover:underline cursor-pointer"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create One"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 leading-relaxed mb-4 text-center">
                Select a test profile to jump straight into the application with zero latency:
              </p>

              {/* 1. Customer Demo */}
              <button
                type="button"
                onClick={() => handleQuickLogin('customer')}
                className="w-full p-3.5 rounded-xl border border-gray-200 hover:border-[#0f3e26] bg-emerald-50/40 hover:bg-emerald-50 flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0f3e26] text-white flex items-center justify-center font-bold text-sm">
                    👤
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#0f3e26]">
                      Customer Account
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      Explore storefront, wishlist, and checkout items
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0f3e26] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 2. Seller Demo */}
              <button
                type="button"
                onClick={() => handleQuickLogin('seller')}
                className="w-full p-3.5 rounded-xl border border-gray-200 hover:border-[#c88a23] bg-amber-50/40 hover:bg-amber-50 flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#c88a23] text-white flex items-center justify-center font-bold text-sm">
                    🏪
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#c88a23]">
                      Verified Seller / Vendor
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      SaaS portal, revenue payouts, stock & catalog
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#c88a23] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 3. Admin Demo */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="w-full p-3.5 rounded-xl border border-gray-200 hover:border-purple-600 bg-purple-50/40 hover:bg-purple-50 flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-900 text-white flex items-center justify-center font-bold text-sm">
                    👑
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-purple-900">
                      Super Admin
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      Platform control, order status & product catalog
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-900 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          © {new Date().getFullYear()} Gjanand Sarkar. 100% Secure & Encrypted.
        </p>

      </div>
    </div>
  );
}

export function LoginView() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafaf8] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#0f3e26] animate-spin" /></div>}>
      <LoginScreenInner />
    </Suspense>
  );
}
