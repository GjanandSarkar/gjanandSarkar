"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { getProducts } from '@/lib/api/products';
import { getUserSubscriptions } from '@/lib/api/subscriptions';
import type { ProductWithVariants } from '@/lib/api/products';
import type { SubscriptionWithProduct } from '@/lib/api/subscriptions';
import { ProductCard } from '@/components/shared/ProductCard';
import { CalendarDays, ArrowRight, Truck, Star, Shield, Leaf, TrendingUp, Clock, Droplets, Package, FlaskConical, Activity, GlassWater, MapPin, ChevronDown } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useStore(state => state.user);
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isMounted, setIsMounted] = useState(false);

  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithProduct[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hasSubscription = subscriptions.length > 0;
  const activeSub = subscriptions[0];

  const categories = [
    { id: 'All', label: t('all'), Icon: Leaf },
    { id: 'Milk', label: t('milk'), Icon: Droplets },
    { id: 'Paneer', label: t('paneer'), Icon: Package },
    { id: 'Ghee', label: t('ghee'), Icon: FlaskConical },
    { id: 'Buttermilk', label: t('buttermilk'), Icon: Activity },
    { id: 'Curd', label: t('curd'), Icon: Package },
    { id: 'Lassi', label: t('lassi'), Icon: GlassWater },
  ];

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);

  const getGreetingKey = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "goodMorning";
    if (hour < 17) return "goodAfternoon";
    return "goodEvening";
  };

  const gujaratiQuotes = [
    "દૂધ પીશો તો જ લડશો! 💪",
    "શુદ્ધ દૂધ, શુદ્ધ સ્વાદ. 🥛",
    "તાજગી એ જ અમારી ઓળખ. 🌿",
    "ખુશ ગાય, શ્રેષ્ઠ દાય. ✨",
    "શક્તિશાળી ગુજરાત, શક્તિશાળી દૂધ! 🥛"
  ];
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    setQuoteIdx(Math.floor(Math.random() * gujaratiQuotes.length));

    async function loadData() {
      const [prods, subs] = await Promise.all([
        getProducts({ activeOnly: true }),
        user ? getUserSubscriptions(user.id) : Promise.resolve([]),
      ]);
      setProducts(prods);
      setSubscriptions(subs.filter(s => s.status !== 'Cancelled'));

      // Staff picks: random 3
      const shuffled = [...prods].sort(() => 0.5 - Math.random()).slice(0, 3);
      setFeaturedProducts(shuffled);
      setIsLoading(false);
    }

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!isMounted) return <div className="min-h-screen" style={{ background: 'var(--color-surface)' }} />;

  // Format next delivery date
  const formatNextDelivery = (dateStr: string | null) => {
    if (!dateStr) return t('tomorrowMorning');
    const date = new Date(dateStr);
    const isToday = date.toDateString() === new Date().toDateString();
    const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString();
    if (isTomorrow) return `${t('tomorrow')}, 7:00 – 9:00 AM`;
    if (isToday) return 'Today, 7:00 – 9:00 AM';
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col pb-20">
      
      {/* ══ HERO SECTION ══ */}
      <section className="relative overflow-hidden px-6 pt-8 pb-10 md:px-10 md:pt-10 md:pb-14">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none blur-[80px]"
          style={{ background: 'var(--color-primary-fixed)' }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-15 pointer-events-none blur-[60px]"
          style={{ background: 'var(--color-tertiary-fixed)' }} />

        <div className="relative z-10 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <button className="inline-flex items-center gap-2 group mb-6 px-3 py-1.5 rounded-full border border-primary/10 bg-primary/5 hover:bg-primary/10 transition-colors"
              onClick={() => router.push('/profile/saved-addresses')}>
              <MapPin className="w-4 h-4 text-primary" strokeWidth={2.5} />
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary leading-none">{t('deliveringTo')}</span>
                <span className="text-[12px] font-bold text-on-surface flex items-center gap-1 group-hover:text-primary transition-colors">
                  Home (Plot 23, Satellite...)
                  <ChevronDown className="w-3 h-3 translate-y-[0.5px]" />
                </span>
              </div>
            </button>

            <h1 className="font-extrabold leading-[1.08] mb-3 tracking-tight"
              style={{ color: 'var(--color-on-surface)', fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-0.025em' }}>
              {t('greetingName', {
                greeting: t(getGreetingKey()),
                name: user?.name?.split(' ')[0] || t('navProfile')
              })}
              .<br />
              <span className="font-normal text-[0.65em]" style={{ color: 'var(--color-on-surface-variant)', letterSpacing: '-0.01em' }}>
                {hasSubscription ? t('favoriteDairy') : t('freshHarvest')}
              </span>
            </h1>

            {/* Easter Egg */}
            <p className="text-[13px] font-medium text-primary/80 italic mt-2 animate-pulse">
               {gujaratiQuotes[quoteIdx]}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══ SUBSCRIPTION STATUS / CTA ══ */}
      <section className="px-5 mb-10 md:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="relative overflow-hidden rounded-[28px] p-7 md:p-10 shadow-2xl shadow-primary/10"
          style={{ 
            background: hasSubscription 
              ? 'linear-gradient(135deg, #fdfbf7 0%, #ffffff 100%)' 
              : 'linear-gradient(135deg, #3f6530 0%, #4a7a38 50%, #3b644c 100%)',
            border: hasSubscription ? '1px solid var(--color-sand)' : 'none'
          }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 bg-white blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10 bg-white blur-3xl" />
          
          {hasSubscription ? (
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
                 onClick={() => router.push('/subscribe')}
                 role="button">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary">{t('nextDelivery')}</span>
                </div>
                <h2 className="text-dark font-black leading-tight mb-2 text-2xl tracking-tight">
                  {formatNextDelivery(activeSub?.next_delivery_date ?? null)}
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-muted">
                    <Droplets className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-wide">{activeSub?.volume || 1}L {t('daily')}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-sand" />
                  <span className="text-xs font-black text-primary uppercase tracking-widest">{t('activePlan')}</span>
                </div>
              </div>
              
              <div className="bg-primary/5 rounded-2xl p-4 flex items-center justify-between md:min-w-[200px] border border-primary/10">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-muted uppercase tracking-[0.1em]">{t('status')}</span>
                   <span className="text-sm font-bold text-dark">{activeSub?.status ?? t('activePlan')}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            </div>
          ) : (
            <>
              <div className="absolute right-8 bottom-0 opacity-[0.12] pointer-events-none">
                <CalendarDays className="w-32 h-32 text-white" strokeWidth={0.75} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
                    Limited Time Offer
                  </div>
                </div>
                
                <h2 className="text-white font-extrabold leading-tight mb-3"
                  style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', letterSpacing: '-0.02em' }}>
                  Get <span className="text-[#ffeb3b]">FREE Delivery</span> forever with a Monthly Subscription! 🥛
                </h2>
                
                <div className="flex flex-col gap-3 mb-7">
                  <div className="flex items-center gap-2.5 text-white/90">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Star className="w-3 h-3 text-[#ffeb3b]" />
                    </div>
                    <span className="text-sm font-medium">Extra 5% off on all items</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-white/90">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Shield className="w-3 h-3 text-[#ffeb3b]" />
                    </div>
                    <span className="text-sm font-medium">Priority 6:00 AM delivery</span>
                  </div>
                </div>

                <Link href="/subscribe"
                  className="inline-flex items-center gap-2 font-black text-sm px-8 py-4 rounded-[18px] transition-all active:scale-95 group"
                  style={{ background: 'white', color: 'var(--color-primary)', boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }}>
                  Start Subscription <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </section>

      {/* ══ FEATURED PICKS ══ */}
      <section className="mb-12" style={{ background: 'var(--color-surface)' }}>
        <div className="px-5 md:px-10 mb-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-secondary)' }} strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase tracking-widest"
                  style={{ color: 'var(--color-secondary)' }}>{t('staffPicks')}</span>
              </div>
              <h2 className="font-bold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
                {t('freshPasture')}
              </h2>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-sm font-semibold"
              style={{ color: 'var(--color-primary)' }}>
              {t('viewAll')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pl-5 md:pl-10 pr-5 pb-4">
            {[1,2,3].map(i => (
              <div key={i} className="w-[180px] h-[240px] shrink-0 rounded-[16px] animate-pulse"
                style={{ background: 'var(--color-surface-container-low)' }} />
            ))}
          </div>
        ) : (
          <>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pl-5 md:pl-10 pr-5 md:hidden pb-4">
              {featuredProducts.map((product, i) => (
                <motion.div key={product.id} className="w-[180px] shrink-0"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
            <div className="hidden md:grid grid-cols-3 gap-6 px-10">
              {featuredProducts.map((product, i) => (
                <motion.div key={product.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ══ CATEGORY BROWSE ══ */}
      <section className="px-5 md:px-10 mb-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-[20px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
            {t('browseCategories')}
          </h3>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-10">
          {categories.map((cat) => {
            const CatIcon = cat.Icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all group"
                style={activeCategory === cat.id ? {
                  background: 'var(--color-primary-fixed)',
                } : {
                  background: 'var(--color-surface-container-low)',
                }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  activeCategory === cat.id ? 'bg-primary text-white shadow-lg' : 'bg-white text-primary group-hover:bg-primary/5'
                }`}>
                  <CatIcon className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className={`text-[11px] font-bold text-center ${
                  activeCategory === cat.id ? 'text-primary' : 'text-on-surface-variant'
                }`}>{cat.label}</span>
              </button>
            );
          })}
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-[240px] rounded-[16px] animate-pulse"
                style={{ background: 'var(--color-surface-container-low)' }} />
            ))}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            variants={container}
            initial="hidden"
            animate="show"
            key={activeCategory}
          >
            {filteredProducts.map((product) => (
              <motion.div key={product.id} variants={item} className="h-full">
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
