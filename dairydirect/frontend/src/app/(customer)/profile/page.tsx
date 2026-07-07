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
import type { UserAddress } from '@/lib/api/addresses';

// Components
import { ProfileSummary } from '@/components/profile/ProfileSummary';
import { RecentOrders } from '@/components/profile/RecentOrders';
import { ActiveSubscriptions } from '@/components/profile/ActiveSubscriptions';
import { AddressSnippet } from '@/components/profile/AddressSnippet';
import { QuickActions } from '@/components/profile/QuickActions';
import { BuyAgainCarousel } from '@/components/discovery/BuyAgainCarousel';
import { EngagementBanner } from '@/components/profile/EngagementBanner';
import { RewardsPreview } from '@/components/profile/RewardsPreview';

// Language Settings Modal components
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Language } from '@/store/useStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const user = useStore((s) => s.user);
  const logoutLocal = useStore((s) => s.logout);
  const setLanguage = useStore((s) => s.setLanguage);
  const updateProfileLocal = useStore((s) => s.updateProfile);
  const addToCartLocal = useStore(state => state.addToCartLocal);

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithProduct[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    Promise.all([
      getUserOrders(user.id),
      getUserSubscriptions(user.id),
      getUserAddresses(user.id)
    ]).then(([ordersData, subsData, addrsData]) => {
      setOrders(ordersData);
      setSubscriptions(subsData);
      setAddresses(addrsData);
      setIsLoading(false);
    });
  }, [user, router]);

  const handleLogout = async () => {
    await supabaseLogout();
    logoutLocal();
    router.replace('/login');
  };

  const handleReorder = async (order: OrderWithItems) => {
    if (!order.order_items) return;
    
    // Dynamically import to prevent circular dependency
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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen pb-[100px] bg-surface-container animate-pulse p-4 gap-6 pt-10">
        <div className="h-32 bg-sand/30 rounded-[24px]" />
        <div className="h-48 bg-sand/30 rounded-[24px]" />
        <div className="h-40 bg-sand/30 rounded-[24px]" />
        <div className="h-32 bg-sand/30 rounded-[24px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-[120px] bg-surface-container">
      <div className="flex-1 max-w-[800px] mx-auto w-full p-4 pt-6 space-y-8">
        
        {/* Profile Summary */}
        <ProfileSummary 
          user={user} 
          onUpdateProfile={updateProfileLocal} 
          onLogout={handleLogout} 
        />

        <RewardsPreview />

        {/* Smart Commerce: Buy Again / Replenishment */}
        <div className="bg-white rounded-[24px] py-4 shadow-sm border border-sand/50">
          <BuyAgainCarousel />
        </div>

        {/* Recent Orders */}
        <RecentOrders 
          orders={orders} 
          onReorder={handleReorder} 
        />

        {/* Active Subscriptions */}
        <ActiveSubscriptions 
          subscriptions={subscriptions} 
        />

        {/* Saved Addresses */}
        <AddressSnippet 
          addresses={addresses} 
        />

        {/* Quick Actions / Settings */}
        <QuickActions 
          onLanguageClick={() => setShowLanguageSettings(true)} 
        />

        <EngagementBanner />

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
