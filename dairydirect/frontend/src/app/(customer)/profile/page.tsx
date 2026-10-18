"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { logout as supabaseLogout } from '@/lib/api/auth';
import { getUserOrders } from '@/lib/api/orders';
import { getUserSubscriptions } from '@/lib/api/subscriptions';
import { getUserAddresses } from '@/lib/api/addresses';
import type { OrderWithItems } from '@/lib/api/orders';
import type { SubscriptionWithProduct } from '@/lib/api/subscriptions';
import { getMySellerInquiry, SellerInquiry } from '@/lib/api/sellers';
import type { UserAddress } from '@/lib/api/addresses';

// Components
import { ProfileSummary } from '@/components/profile/ProfileSummary';
import { RecentOrders } from '@/components/profile/RecentOrders';
import { ActiveSubscriptions } from '@/components/profile/ActiveSubscriptions';
import { AddressSnippet } from '@/components/profile/AddressSnippet';
import { QuickActions } from '@/components/profile/QuickActions';
import { BuyAgainCarousel } from '@/components/discovery/BuyAgainCarousel';
import { EngagementBanner } from '@/components/profile/EngagementBanner';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useTheme } from '@/components/theme/ThemeProvider';

// Icons & Animations
import { 
  X, 
  Check, 
  Loader2, 
  ChevronDown, 
  Trophy, 
  Repeat, 
  Package, 
  CalendarDays, 
  MapPin, 
  Settings2,
  LogOut,
  Store,
  ShieldCheck,
  Clock,
  XCircle,
  ArrowRight,
  AlertTriangle,
  Globe,
  Heart,
  Bell,
  ChevronRight,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Language } from '@/store/useStore';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  subtitle,
  badge,
  icon,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-surface-muted/50 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-xs sm:text-sm tracking-tight leading-tight">{title}</h3>
            {subtitle && (
              <p className="text-[11px] font-medium text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md">
              {badge}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-foreground' : ''}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/60 bg-surface-muted/20">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const user = useStore((s) => s.user);

  // Loyalty progress, derived from the real balance rather than hardcoded.
  const REWARD_THRESHOLD = 200;
  const loyaltyPoints = user?.loyalty_points ?? 0;
  const pointsToReward = Math.max(0, REWARD_THRESHOLD - loyaltyPoints);
  const rewardProgressPct = Math.min(
    100,
    Math.round((loyaltyPoints / REWARD_THRESHOLD) * 100),
  );
  const isAuthLoading = useStore((s) => s.isAuthLoading);
  const logoutLocal = useStore((s) => s.logout);
  const setLanguage = useStore((s) => s.setLanguage);
  const updateProfileLocal = useStore((s) => s.updateProfile);
  const addToCartLocal = useStore(state => state.addToCartLocal);
  const setNotificationDrawerOpen = useStore((s) => s.setNotificationDrawerOpen);

  const { theme, toggleTheme } = useTheme();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithProduct[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [sellerInquiry, setSellerInquiry] = useState<SellerInquiry | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);

  // Keep track of open state for each collapsible accordion block
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    rewards: false,
    buyAgain: false,
    orders: false,
    subscriptions: false,
    addresses: false,
    settings: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      router.replace('/auth/login?redirect=' + encodeURIComponent('/profile'));
      return;
    }

    Promise.all([
      getUserOrders(user.id),
      getUserSubscriptions(user.id),
      getUserAddresses(user.id),
      getMySellerInquiry().catch(() => null)
    ]).then(([ordersData, subsData, addrsData, inqData]) => {
      setOrders(ordersData);
      setSubscriptions(subsData);
      setAddresses(addrsData);
      setSellerInquiry(inqData);
      setIsLoading(false);
    });
  }, [user?.id, router, isAuthLoading]);

  const handleLogout = async () => {
    await supabaseLogout();
    logoutLocal();
    router.replace('/auth/login');
  };

  const handleReorder = async (order: OrderWithItems) => {
    if (!order.order_items) return;
    
    const { addToCart } = await import('@/lib/api/cart');
    const promises: Promise<any>[] = [];

    for (const item of order.order_items) {
      if (item.product_id && item.variant_id) {
        addToCartLocal(item.product_id, item.variant_id, item.quantity);
        if (user) {
          promises.push(addToCart(user.id, item.product_id, item.variant_id, item.quantity));
        }
      }
    }
    
    if (promises.length > 0) {
      await Promise.all(promises);
    }
    
    router.push('/cart');
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen pb-[100px] bg-background animate-pulse p-4 gap-4 max-w-2xl mx-auto w-full pt-8">
        <div className="h-32 bg-surface-muted rounded-xl border border-border" />
        <div className="h-16 bg-surface-muted rounded-xl border border-border" />
        <div className="h-16 bg-surface-muted rounded-xl border border-border" />
        <div className="h-16 bg-surface-muted rounded-xl border border-border" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background text-foreground transition-colors duration-150">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 w-full">
        
        {/* ========================================================= */}
        {/* DESKTOP BENTO GRID LAYOUT (>= md)                        */}
        {/* ========================================================= */}
        <div className="hidden md:grid grid-cols-12 gap-5">
          
          {/* Bento Cell 1: Profile Summary & Identity (8 Cols) */}
          <div className="col-span-8">
            <ProfileSummary 
              user={user} 
              onUpdateProfile={updateProfileLocal} 
            />
          </div>

          {/* Bento Cell 2: Rewards & Loyalty (4 Cols) */}
          <div className="col-span-4 bg-surface rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                  Farm Club Member
                </span>
              </div>
              <h3 className="font-black text-base text-foreground tracking-tight">GjanandSarkar Rewards</h3>
              <p className="text-xs text-foreground-muted mt-0.5">Earn points and unlock free farm deliveries</p>

              <div className="py-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-3xl font-black text-foreground tracking-tight tabular-nums">
                    {loyaltyPoints}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {pointsToReward > 0 ? `${pointsToReward} pts to reward` : 'Reward Unlocked!'}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-surface-muted rounded-full overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${rewardProgressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-foreground-muted border-t border-border/60 pt-3">
              Earn 10 points for every ₹100 spent across all verified dairy products.
            </p>
          </div>

          {/* Bento Cell 3: Active Subscriptions (4 Cols) */}
          <div className="col-span-4 bg-surface rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <CalendarDays className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Subscriptions</h4>
                    <span className="text-[11px] text-foreground-muted">Daily milk & recurring staples</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-md">
                  {subscriptions.length} Active
                </span>
              </div>

              {subscriptions.length > 0 ? (
                <div className="py-2 space-y-2">
                  {subscriptions.slice(0, 2).map((sub) => (
                    <div key={sub.id} className="p-2.5 rounded-xl bg-surface-muted border border-border/70 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-foreground truncate">{sub.products?.name || 'Daily Plan'}</p>
                        <p className="text-[10px] text-foreground-muted">{sub.plan} • {sub.volume} unit(s)</p>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-foreground-muted">No active daily subscriptions.</p>
                </div>
              )}
            </div>

            <Link
              href="/subscribe"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-3 border-t border-border/60"
            >
              <span>Manage Subscriptions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Bento Cell 4: Recent Orders (4 Cols) */}
          <div className="col-span-4 bg-surface rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Package className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Recent Orders</h4>
                    <span className="text-[11px] text-foreground-muted">Track & reorder essentials</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-surface-muted text-foreground-muted px-2 py-0.5 rounded-md border border-border">
                  {orders.length} Total
                </span>
              </div>

              {orders.length > 0 ? (
                <div className="py-2 space-y-2">
                  {orders.slice(0, 2).map((order) => (
                    <div key={order.id} className="p-2.5 rounded-xl bg-surface-muted border border-border/70 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <p className="text-[10px] text-foreground-muted">
                          ₹{order.total_amount} • {order.order_items?.length || 1} items
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-foreground-muted">No orders placed yet.</p>
                </div>
              )}
            </div>

            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-3 border-t border-border/60"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Bento Cell 5: Saved Addresses (4 Cols) */}
          <div className="col-span-4 bg-surface rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Saved Addresses</h4>
                    <span className="text-[11px] text-foreground-muted">Delivery locations & pin</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-surface-muted text-foreground-muted px-2 py-0.5 rounded-md border border-border">
                  {addresses.length} Saved
                </span>
              </div>

              {addresses.length > 0 ? (
                <div className="py-2">
                  <div className="p-2.5 rounded-xl bg-surface-muted border border-border/70">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold text-foreground">{addresses[0].label}</span>
                      {addresses[0].is_default && (
                        <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.2 rounded font-bold">Default</span>
                      )}
                    </div>
                    <p className="text-[11px] text-foreground-muted line-clamp-2">{addresses[0].address}</p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-foreground-muted">No addresses saved yet.</p>
                </div>
              )}
            </div>

            <Link
              href="/profile/saved-addresses"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-3 border-t border-border/60"
            >
              <span>Manage Addresses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Bento Cell 6: Settings, Appearance & Preferences (6 Cols) */}
          <div className="col-span-6 bg-surface rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 pb-3 border-b border-border/60 mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Preferences & Theme</h4>
                  <p className="text-[11px] text-foreground-muted">Display mode, language and notifications</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Theme Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-3.5 rounded-xl bg-surface-muted hover:bg-surface border border-border/70 hover:border-border transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99] group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border/70 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                      {theme === 'dark' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">Color Theme</p>
                      <p className="text-[11px] text-foreground-muted capitalize">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </button>

                {/* 2. Language Selection Button */}
                <button
                  type="button"
                  onClick={() => setShowLanguageSettings(true)}
                  className="p-3.5 rounded-xl bg-surface-muted hover:bg-surface border border-border/70 hover:border-border transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99] group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border/70 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                      <Globe className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">App Language</p>
                      <p className="text-[11px] text-foreground-muted truncate">{language === 'hi' ? 'हिंदी (Hindi)' : language === 'gu' ? 'ગુજરાતી' : 'English'}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </button>

                {/* 3. Wishlist Button */}
                <Link
                  href="/wishlist"
                  className="p-3.5 rounded-xl bg-surface-muted hover:bg-surface border border-border/70 hover:border-border transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99] group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border/70 flex items-center justify-center text-rose-500 shrink-0 group-hover:scale-105 transition-transform">
                      <Heart className="w-4.5 h-4.5 fill-rose-500/20" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">Saved Wishlist</p>
                      <p className="text-[11px] text-foreground-muted">Favorite products</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </Link>

                {/* 4. Notifications Drawer Button */}
                <button
                  type="button"
                  onClick={() => setNotificationDrawerOpen(true)}
                  className="p-3.5 rounded-xl bg-surface-muted hover:bg-surface border border-border/70 hover:border-border transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99] group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border/70 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                      <Bell className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">Notifications</p>
                      <p className="text-[11px] text-foreground-muted">Delivery & updates</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Bento Cell 7: Seller Program & Privileges (6 Cols) */}
          <div className="col-span-6 bg-surface rounded-2xl border border-border p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 pb-3 border-b border-border/60 mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Direct Farm Sourcing</h4>
                  <p className="text-[11px] text-foreground-muted">Verified producer operations, purity certificates & safety</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Seller Portal */}
                <Link
                  href="/become-seller"
                  className="p-3.5 rounded-xl bg-surface-muted hover:bg-surface border border-border/70 hover:border-border transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99] group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border/70 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                      <Store className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">Seller Portal</p>
                      <p className="text-[11px] text-foreground-muted truncate">Farm partner program</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </Link>

                {/* 2. Quality Lab Reports */}
                <Link
                  href="/profile/quality-reports"
                  className="p-3.5 rounded-xl bg-surface-muted hover:bg-surface border border-border/70 hover:border-border transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99] group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border/70 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">Lab Certificates</p>
                      <p className="text-[11px] text-foreground-muted truncate">Daily batch purity</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </Link>

                {/* 3. Saved Addresses */}
                <Link
                  href="/profile/saved-addresses"
                  className="p-3.5 rounded-xl bg-surface-muted hover:bg-surface border border-border/70 hover:border-border transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99] group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border/70 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">Saved Addresses</p>
                      <p className="text-[11px] text-foreground-muted truncate">{addresses.length} location(s)</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </Link>

                {/* 4. Sign Out */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-3.5 rounded-xl bg-surface-muted hover:bg-rose-500/10 border border-border/70 hover:border-rose-200 transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99] group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border/70 flex items-center justify-center text-rose-500 shrink-0 group-hover:scale-105 transition-transform">
                      <LogOut className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-rose-600">Sign Out</p>
                      <p className="text-[11px] text-rose-500/80 truncate">Log out of account</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* MOBILE LAYOUT (< md)                                      */}
        {/* ========================================================= */}
        <div className="block md:hidden space-y-4">
          
          {/* Profile Summary with Edit Drawer */}
          <ProfileSummary 
            user={user} 
            onUpdateProfile={updateProfileLocal} 
          />

          {/* ── Quick Access Shortcuts Grid (Missed Options) ── */}
          <div className="bg-surface rounded-2xl border border-border p-3.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2.5 px-1">
              Quick Shortcuts
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <Link
                href="/subscribe"
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-muted hover:bg-primary/10 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-bold text-foreground leading-tight">Subscriptions</span>
              </Link>

              <Link
                href="/profile/saved-addresses"
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-muted hover:bg-primary/10 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <MapPin className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-bold text-foreground leading-tight">Addresses</span>
              </Link>

              <Link
                href="/orders"
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-muted hover:bg-primary/10 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <Package className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-bold text-foreground leading-tight">Orders</span>
              </Link>

              <Link
                href="/wishlist"
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-muted hover:bg-primary/10 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <Heart className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-bold text-foreground leading-tight">Wishlist</span>
              </Link>

              <button
                type="button"
                onClick={() => setNotificationDrawerOpen(true)}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-muted hover:bg-primary/10 transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-bold text-foreground leading-tight">Alerts</span>
              </button>

              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-muted">
                <ThemeToggle variant="icon" />
                <span className="text-[11px] font-bold text-foreground leading-tight mt-1">Theme</span>
              </div>

              <button
                type="button"
                onClick={() => setShowLanguageSettings(true)}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-muted hover:bg-primary/10 transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <Globe className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-bold text-foreground leading-tight">Language</span>
              </button>

              <Link
                href="/become-seller"
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-muted hover:bg-primary/10 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <Store className="w-4.5 h-4.5" />
                </div>
                <span className="text-[11px] font-bold text-foreground leading-tight">Sell</span>
              </Link>
            </div>
          </div>

          {/* Collapsible Section 1: Rewards */}
          <CollapsibleSection
            title="GjanandSarkar Rewards"
            subtitle="Earn points and unlock free deliveries"
            badge={`${loyaltyPoints} Points`}
            icon={<Trophy className="w-5 h-5" />}
            isOpen={openSections.rewards}
            onToggle={() => toggleSection('rewards')}
          >
            <div className="py-2.5">
              <div className="flex items-end justify-between mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-foreground tracking-tight tabular-nums">
                    {loyaltyPoints}
                  </span>
                  <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Points</span>
                </div>
                {pointsToReward > 0 ? (
                  <span className="text-[11px] font-semibold text-primary tabular-nums">
                    {pointsToReward} pts to your next reward
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-primary">
                    Reward unlocked
                  </span>
                )}
              </div>
              <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${rewardProgressPct}%` }}
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Collapsible Section 2: Buy It Again */}
          <CollapsibleSection
            title="Buy It Again"
            subtitle="Frequently ordered products"
            icon={<Repeat className="w-5 h-5" />}
            isOpen={openSections.buyAgain}
            onToggle={() => toggleSection('buyAgain')}
          >
            <div className="py-2">
              <BuyAgainCarousel />
            </div>
          </CollapsibleSection>

          {/* Collapsible Section 3: Recent Orders */}
          <CollapsibleSection
            title="Recent Orders"
            subtitle="Track shipments & check order history"
            badge={orders.length > 0 ? `${orders.length} ${orders.length === 1 ? 'Order' : 'Orders'}` : undefined}
            icon={<Package className="w-5 h-5" />}
            isOpen={openSections.orders}
            onToggle={() => toggleSection('orders')}
          >
            <div className="py-2">
              <RecentOrders 
                orders={orders} 
                onReorder={handleReorder} 
                hideHeader 
              />
            </div>
          </CollapsibleSection>

          {/* Collapsible Section 4: Active Subscriptions */}
          <CollapsibleSection
            title="My Subscriptions"
            subtitle="Manage recurring milk & organic plans"
            badge={subscriptions.length > 0 ? `${subscriptions.length} Active` : undefined}
            icon={<CalendarDays className="w-5 h-5" />}
            isOpen={openSections.subscriptions}
            onToggle={() => toggleSection('subscriptions')}
          >
            <div className="py-2">
              <ActiveSubscriptions 
                subscriptions={subscriptions} 
                hideHeader 
              />
            </div>
          </CollapsibleSection>

          {/* Collapsible Section 5: Saved Addresses */}
          <CollapsibleSection
            title="Saved Addresses"
            subtitle="Configure delivery coordinates"
            badge={addresses.length > 0 ? `${addresses.length} ${addresses.length === 1 ? 'Address' : 'Addresses'}` : undefined}
            icon={<MapPin className="w-5 h-5" />}
            isOpen={openSections.addresses}
            onToggle={() => toggleSection('addresses')}
          >
            <div className="py-2">
              <AddressSnippet 
                addresses={addresses} 
                hideHeader 
              />
            </div>
          </CollapsibleSection>

          <EngagementBanner />

          {/* Sign Out Button */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-surface hover:bg-rose-500/10 border border-rose-200 hover:border-rose-300 px-8 py-3 rounded-full shadow-2xs active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>

      </div>

      {/* Language Modal (Reused from previous design) */}
      {/* Language Modal */}
      <AnimatePresence>
        {showLanguageSettings && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-surface w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border border-border relative"
            >
              <div className="flex justify-between items-center p-4 border-b border-border">
                <h3 className="text-base font-bold text-foreground">{t('languageSettings')}</h3>
                <button
                  type="button"
                  onClick={() => setShowLanguageSettings(false)}
                  className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center text-foreground hover:bg-border/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 space-y-1.5">
                {[
                  { code: 'en', label: 'English', sub: 'English' },
                  { code: 'hi', label: 'हिंदी', sub: 'Hindi' },
                  { code: 'gu', label: 'ગુજરાતી', sub: 'Gujarati' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as Language);
                      setTimeout(() => setShowLanguageSettings(false), 200);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      language === lang.code
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-surface hover:bg-surface-muted text-foreground'
                    }`}
                  >
                    <div className="text-left">
                      <span className="block font-bold text-xs">{lang.label}</span>
                      <span className="block text-[11px] text-muted">{lang.sub}</span>
                    </div>
                    {language === lang.code && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-foreground-inverse">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
