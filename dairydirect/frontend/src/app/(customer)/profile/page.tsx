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
  AlertTriangle
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
    <div className="bg-white rounded-[24px] border border-sand/50 shadow-xs overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4.5 flex items-center justify-between hover:bg-sand/10 active:bg-sand/20 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-sand/30 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="font-extrabold text-dark text-[15px] tracking-wide leading-tight">{title}</h3>
            {subtitle && (
              <p className="text-[11px] font-semibold text-muted tracking-tight mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {badge && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#0f3e26]/10 text-[#0f3e26] px-2.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          <ChevronDown className={`w-5 h-5 text-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-dark' : ''}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 pt-1.5 border-t border-sand/30 bg-gray-50/20">
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
  }, [user, router, isAuthLoading]);

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
      <div className="flex flex-col min-h-screen pb-[100px] bg-surface-container animate-pulse p-4 gap-6 pt-10">
        <div className="h-32 bg-sand/30 rounded-[24px]" />
        <div className="h-20 bg-sand/30 rounded-[24px]" />
        <div className="h-20 bg-sand/30 rounded-[24px]" />
        <div className="h-20 bg-sand/30 rounded-[24px]" />
        <div className="h-20 bg-sand/30 rounded-[24px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-[120px] bg-surface-container">
      <div className="flex-1 max-w-[800px] mx-auto w-full p-4 pt-6 space-y-4">
        
        {/* Profile Summary (Always visible at the top) */}
        <ProfileSummary 
          user={user} 
          onUpdateProfile={updateProfileLocal} 
        />

        {/* Seller Account / Application Status Card */}
        {sellerInquiry ? (
          <div className="bg-white rounded-[24px] border border-sand/50 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0f3e26]/10 flex items-center justify-center text-[#0f3e26]">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-dark text-[15px] leading-tight">
                    Seller Account Status
                  </h3>
                  <p className="text-[12px] font-semibold text-muted">
                    {sellerInquiry.business_name} ({sellerInquiry.category})
                  </p>
                </div>
              </div>

              {sellerInquiry.status === 'approved' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Approved</span>
                </span>
              )}
              {sellerInquiry.status === 'pending' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Approval</span>
                </span>
              )}
              {sellerInquiry.status === 'rejected' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Rejected</span>
                </span>
              )}
              {sellerInquiry.status === 'suspended' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-black uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Suspended</span>
                </span>
              )}
            </div>

            {sellerInquiry.status === 'pending' && (
              <p className="text-xs text-gray-600 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 leading-relaxed">
                Your seller application has been submitted successfully and is awaiting admin approval. Duplicate submissions are prevented while under review.
              </p>
            )}

            {sellerInquiry.status === 'rejected' && (
              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/60 text-xs text-rose-900 space-y-1">
                <p className="font-bold">Rejection Reason:</p>
                <p>{sellerInquiry.admin_notes || 'Application did not satisfy verification criteria. You may edit and resubmit.'}</p>
              </div>
            )}

            <div className="flex items-center justify-end pt-1">
              {sellerInquiry.status === 'approved' ? (
                <Link
                  href="/seller/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                >
                  <span>Open Seller Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href="/become-seller"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
                >
                  <span>{sellerInquiry.status === 'rejected' ? 'Edit & Resubmit Application' : 'View Application Details'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-emerald-50/80 to-amber-50/60 rounded-[24px] border border-emerald-200/50 shadow-xs p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#0f3e26] text-white flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-sm">Sell on Gjanand Sarkar</h4>
                <p className="text-xs text-gray-600 mt-0.5">Reach pan-India customers with direct-from-source verified seller privileges.</p>
              </div>
            </div>
            <Link
              href="/become-seller"
              className="px-4 py-2.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-black rounded-xl shrink-0 transition-all shadow-2xs flex items-center gap-1"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#c88a23]" />
            </Link>
          </div>
        )}

        {/* Section 1: GjanandSarkar Rewards */}
        <CollapsibleSection
          title="GjanandSarkar Rewards"
          subtitle="Earn points and unlock free deliveries"
          badge={`${loyaltyPoints} Points`}
          icon={<Trophy className="w-5 h-5" />}
          isOpen={openSections.rewards}
          onToggle={() => toggleSection('rewards')}
        >
          {/* Was a hardcoded 150 points with a 75%-full bar and "50 pts to
              Free Delivery", shown identically to every account — including
              brand new ones with no orders. `profiles.loyalty_points` is a
              real column that orders accrue into, so this now reads it. */}
          <div className="py-2.5">
            <div className="flex items-end justify-between mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-dark tracking-tight tabular-nums">
                  {loyaltyPoints}
                </span>
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Points</span>
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
            <div className="h-2 w-full bg-sand rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-[width] duration-500"
                style={{ width: `${rewardProgressPct}%` }}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Section 2: Buy It Again */}
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

        {/* Section 3: Recent Orders */}
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

        {/* Section 4: Active Subscriptions */}
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

        {/* Section 5: Saved Addresses */}
        <CollapsibleSection
          title="Saved Addresses"
          subtitle="Configure home & office delivery coordinates"
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

        {/* Section 6: Settings & Support */}
        <CollapsibleSection
          title="Settings & Support"
          subtitle="Change language, read reports or contact us"
          icon={<Settings2 className="w-5 h-5" />}
          isOpen={openSections.settings}
          onToggle={() => toggleSection('settings')}
        >
          <div className="py-2">
            <QuickActions 
              onLanguageClick={() => setShowLanguageSettings(true)} 
              hideHeader 
            />
          </div>
        </CollapsibleSection>

        <EngagementBanner />

        {/* Sign Out Button at the very bottom */}
        <div className="pt-4 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 text-sm font-extrabold text-red-600 hover:text-red-700 bg-white hover:bg-red-50/50 border border-red-200 hover:border-red-300 px-8 py-3 rounded-full shadow-xs hover:shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

      {/* Language Modal (Reused from previous design) */}
      <AnimatePresence>
        {showLanguageSettings && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="flex justify-between items-center p-6 border-b border-sand/50">
                <h3 className="text-xl font-bold text-dark">{t('languageSettings')}</h3>
                <button
                  type="button"
                  onClick={() => setShowLanguageSettings(false)}
                  className="w-10 h-10 rounded-full bg-sand/30 flex items-center justify-center text-dark hover:bg-sand/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { code: 'en', label: 'English', sub: 'English' },
                  { code: 'hi', label: 'हिंदी', sub: 'Hindi' },
                  { code: 'gu', label: 'ગુજરાતી', sub: 'Gujarati' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as Language);
                      setTimeout(() => setShowLanguageSettings(false), 300);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-[16px] border transition-all ${
                      language === lang.code
                        ? 'border-primary bg-primary/5 shadow-[0_4px_20px_rgba(63,101,48,0.08)]'
                        : 'border-transparent bg-white hover:bg-sand/10'
                    }`}
                  >
                    <div className="text-left">
                      <span className="block font-bold text-dark text-base">{lang.label}</span>
                      <span className="block text-xs font-medium text-muted mt-0.5">{lang.sub}</span>
                    </div>
                    {language === lang.code && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
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
