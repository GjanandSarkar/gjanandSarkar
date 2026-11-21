"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  User,
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { getURL } from '@/lib/utils';
import Link from 'next/link';

type AuthUser = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: 'customer' | 'admin' | 'seller';
  loyalty_points?: number;
  saved_addresses?: unknown[];
};

/**
 * Only allow same-origin, absolute-path redirects.
 *
 * `?redirect=https://evil.example` or `?redirect=//evil.example` would turn the
 * login page into an open redirect, which is routinely used for phishing.
 */
function safeRedirect(value: string | null): string {
  if (!value) return '/home';
  if (!value.startsWith('/') || value.startsWith('//')) return '/home';
  if (value.startsWith('/login') || value.startsWith('/auth/login')) return '/home';
  return value;
}

function destinationFor(role: string | undefined, next: string): string {
  if (role === 'admin' && (next === '/home' || next === '/')) return '/admin';
  if (role === 'seller' && (next === '/home' || next === '/')) return '/seller/dashboard';
  return next;
}

function LoginScreenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useStore((s) => s.setUser);

  const next = safeRedirect(searchParams.get('redirect') || searchParams.get('next'));

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /**
   * Exchange a Supabase session for the application's HttpOnly cookie and
   * read the authoritative role from the server.
   *
   * Role is NEVER inferred here. Previously the client treated any email
   * containing "admin" as an administrator, which is both wrong and a
   * privilege-escalation footgun.
   */
  const syncSession = async (accessToken: string): Promise<AuthUser> => {
    const res = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: accessToken, type: 'supabase' }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.error || 'We could not load your account. Please try again.');
    }

    const raw = await res.json();
    const profile: AuthUser | undefined = raw.user || raw.data?.user;
    if (!profile?.id) {
      throw new Error('We could not load your account. Please try again.');
    }
    return profile;
  };

  const applyProfile = (profile: AuthUser) => {
    const resolvedName =
      (profile.name && profile.name.trim()) ||
      (profile.email ? profile.email.split('@')[0] : profile.phone ? `User (${profile.phone.slice(-4)})` : 'Customer');

    setUser({
      id: profile.id,
      name: resolvedName,
      phone: profile.phone || '',
      email: profile.email || '',
      avatar_url: profile.avatar_url || '',
      role: profile.role ?? 'customer',
      loyalty_points: profile.loyalty_points ?? 0,
      saved_addresses: (profile.saved_addresses as { label: string; address: string }[]) || [],
    });

    return profile.role ?? 'customer';
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: name || email.split('@')[0], full_name: name || email.split('@')[0] },
          },
        });
        if (signUpError) throw signUpError;

        if (data.session?.access_token) {
          const profile = await syncSession(data.session.access_token);
          const role = applyProfile(profile);
          setSuccessMsg('Account created. Taking you in…');
          router.replace(destinationFor(role, next));
          return;
        }

        setSuccessMsg('Check your email to confirm your account, then sign in.');
        setIsSignUp(false);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      if (!data.session?.access_token) {
        throw new Error('Sign-in succeeded but no session was returned. Please try again.');
      }

      const profile = await syncSession(data.session.access_token);
      const role = applyProfile(profile);
      setSuccessMsg('Signed in. Taking you in…');
      router.replace(destinationFor(role, next));
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getURL()}/auth/callback?redirect=${encodeURIComponent(next)}`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start Google sign-in.';
      setError(message);
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all min-h-[48px]';

  return (
<<<<<<< HEAD
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary/10 blur-[100px] pointer-events-none" aria-hidden="true" />
=======
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative transition-colors duration-150" suppressHydrationWarning>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

      <div className="w-full max-w-[430px] relative z-10">
        <div className="flex flex-col items-center mb-6 text-center">
<<<<<<< HEAD
          <Link href="/home" className="flex items-center gap-2 shrink-0 active:scale-95 transition-transform mb-3">
            <img
              src="/application logo/gjanand sarkar logo.png"
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="flex flex-col text-left">
              <span className="text-2xl font-semibold tracking-tight leading-none text-primary">Gjanand</span>
              <span className="text-[11px] tracking-[0.22em] font-semibold text-secondary-ink uppercase leading-none mt-1">
                SARKAR
              </span>
            </span>
          </Link>
          <p className="text-sm text-foreground-muted font-medium">
            India&apos;s curated marketplace for everyday essentials
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-lg p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-foreground-muted mt-1">
              {isSignUp
                ? 'One account for orders, subscriptions and delivery updates.'
                : 'Sign in to track orders and manage your deliveries.'}
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-4 p-3 rounded-xl bg-error-bg border border-error/20 text-sm font-medium text-error">
=======
          <Link href="/home" className="flex items-center gap-2 shrink-0 group active:scale-95 transition-transform mb-3">
            <div className="relative flex items-center">
              <img
                src="/application logo/gjanand sarkar logo.png"
                alt="Gjanand Sarkar"
                className="h-14 w-auto object-contain drop-shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="flex flex-col text-left">
                <span className="text-2xl font-black tracking-tight leading-none text-foreground">
                  Gjanand
                </span>
                <span className="text-[11px] tracking-[0.2em] font-black text-secondary uppercase text-right leading-none mt-0.5">
                  SARKAR
                </span>
              </div>
            </div>
          </Link>
          <p className="text-xs text-muted font-medium">
            India's Purest Heritage & Artisanal Marketplace
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-surface rounded-2xl border border-border/80 shadow-xl p-6 sm:p-8 backdrop-blur-sm">
          
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-surface-muted rounded-xl mb-6 text-xs font-bold border border-border/60">
            <button
              type="button"
              onClick={() => { setMode('password'); setError(''); }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'password'
                  ? 'bg-surface text-foreground shadow-2xs font-black'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Sign In / Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setMode('quick'); setError(''); }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                mode === 'quick'
                  ? 'bg-surface text-secondary shadow-2xs font-black'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              <span>Instant Access</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-500">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              {error}
            </div>
          )}

          {successMsg && (
<<<<<<< HEAD
            <div role="status" className="mb-4 p-3 rounded-xl bg-success-bg border border-success/20 text-sm font-medium text-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
=======
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              <span>{successMsg}</span>
            </div>
          )}

<<<<<<< HEAD
          <form onSubmit={handleEmailAuth} className="space-y-4" noValidate>
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    autoComplete="name"
                    className={inputClass}
                    required={isSignUp}
=======
          {mode === 'password' ? (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      required={isSignUp}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-xs text-foreground placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-xs text-foreground placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  />
                </div>
              </div>
            )}

<<<<<<< HEAD
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  className={inputClass}
                  required
                />
=======
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-foreground">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-xs text-foreground placeholder-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              </div>
            </div>

<<<<<<< HEAD
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                {!isSignUp && (
                  <Link href="/contact?topic=account" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  minLength={6}
                  className={inputClass}
                  required
                />
              </div>
            </div>
=======
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-foreground-inverse font-black text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{isSignUp ? 'Create My Account' : 'Sign In'}</span>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-3 text-muted text-[10px] uppercase font-bold tracking-wider">or</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 bg-surface border border-border hover:bg-surface-muted text-foreground font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                  className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create One"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted leading-relaxed mb-4 text-center">
                Select a test profile to jump straight into the application with zero latency:
              </p>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] py-3 bg-primary hover:bg-primary-hover text-on-primary font-semibold text-sm rounded-xl transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Please wait…</span>
                </>
              ) : (
                <span>{isSignUp ? 'Create account' : 'Sign in'}</span>
              )}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink mx-3 text-foreground-muted text-[11px] uppercase font-semibold tracking-wider">or</span>
              <div className="flex-grow border-t border-border" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full min-h-[48px] py-3 bg-surface border border-border hover:bg-surface-muted text-foreground font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
<<<<<<< HEAD
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-sm font-medium text-primary hover:underline cursor-pointer"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
=======
                onClick={() => handleQuickLogin('customer')}
                className="w-full p-3.5 rounded-xl border border-border hover:border-primary bg-primary/5 hover:bg-primary/10 flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      Customer Account
                    </h4>
                    <p className="text-[10px] text-muted">
                      Explore storefront, wishlist, and checkout items
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 2. Seller Demo */}
              <button
                type="button"
                onClick={() => handleQuickLogin('seller')}
                className="w-full p-3.5 rounded-xl border border-border hover:border-secondary bg-surface-muted/50 hover:bg-surface-muted flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary text-white flex items-center justify-center font-bold text-sm">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-secondary transition-colors">
                      Verified Seller / Vendor
                    </h4>
                    <p className="text-[10px] text-muted">
                      SaaS portal, revenue payouts, stock & catalog
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-secondary group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 3. Admin Demo */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="w-full p-3.5 rounded-xl border border-border hover:border-slate-800 bg-surface-muted/50 hover:bg-surface-muted flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-slate-900 transition-colors">
                      Super Admin
                    </h4>
                    <p className="text-[10px] text-muted">
                      Platform control, order status & product catalog
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-slate-900 group-hover:translate-x-0.5 transition-transform" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-foreground-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>Your details are used only to deliver your orders.</span>
          </div>
        </div>

<<<<<<< HEAD
        <p className="text-center text-[11px] text-foreground-muted mt-5">
          By continuing you agree to our{' '}
          <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
=======
        <p className="text-center text-[11px] text-muted mt-6">
          © {new Date().getFullYear()} Gjanand Sarkar. 100% Secure & Encrypted.
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        </p>
      </div>
    </div>
  );
}

export function LoginView() {
  return (
<<<<<<< HEAD
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" aria-label="Loading" />
        </div>
      }
    >
=======
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
      <LoginScreenInner />
    </Suspense>
  );
}
