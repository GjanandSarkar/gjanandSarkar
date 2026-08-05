"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  Star, 
  ArrowRight, 
  ShoppingCart, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  HeartHandshake, 
  FlaskConical, 
  Milk, 
  Flame, 
  Truck, 
  Wine, 
  Award,
  Activity,
  Dumbbell,
  Zap,
  SmilePlus
} from 'lucide-react';
import type { ProductWithVariants } from '@/lib/api/products';
import { useStore } from '@/store/useStore';
import { addToCart } from '@/lib/api/cart';

interface DealsAndBrandsProps {
  products: ProductWithVariants[];
}

export function DealsAndBrands({ products }: DealsAndBrandsProps) {
  const user = useStore((s) => s.user);
  const addToCartLocal = useStore((s) => s.addToCartLocal);

  // Live Countdown State for Deal of the Day
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 45, seconds: 32 });
  
  // Interactive Customer Tab: 'purity' | 'wellness'
  const [activeTab, setActiveTab] = useState<'purity' | 'wellness'>('purity');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Customer Experience - 100% Purity & Vedic Guarantees
  const purityPromises = [
    {
      title: '4 AM Farm Milking',
      desc: 'Untouched & fresh',
      icon: Milk,
      iconColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      href: '/products?category=A2+Dairy'
    },
    {
      title: 'Daily Lab Tested',
      desc: 'Zero adulteration',
      icon: FlaskConical,
      iconColor: 'text-blue-700 bg-blue-50 border-blue-200',
      href: '/profile/quality-reports'
    },
    {
      title: 'Vedic Bilona Ghee',
      desc: 'Curd churned method',
      icon: Flame,
      iconColor: 'text-amber-700 bg-amber-50 border-amber-200',
      href: '/products?category=A2+Dairy'
    },
    {
      title: '100% Grass-Fed',
      desc: 'Desi Gir & Sahiwal',
      icon: Sparkles,
      iconColor: 'text-green-700 bg-green-50 border-green-200',
      href: '/products'
    },
    {
      title: '7 AM Doorstep',
      desc: '4°C Cold chain direct',
      icon: Truck,
      iconColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      href: '/subscribe'
    },
    {
      title: 'Eco Glass Bottles',
      desc: 'Sterile, zero plastic',
      icon: Wine,
      iconColor: 'text-teal-700 bg-teal-50 border-teal-200',
      href: '/products'
    },
    {
      title: 'Farmer First',
      desc: '100% Fair price to kisans',
      icon: HeartHandshake,
      iconColor: 'text-rose-700 bg-rose-50 border-rose-200',
      href: '/become-seller'
    },
    {
      title: 'FSSAI Certified',
      desc: 'Government verified',
      icon: Award,
      iconColor: 'text-purple-700 bg-purple-50 border-purple-200',
      href: '/profile/quality-reports'
    }
  ];

  // Customer Experience - Shop by Health & Wellness Goals
  const wellnessGoals = [
    {
      title: 'Immunity & Gut',
      desc: 'Probiotic curd & lassi',
      icon: Activity,
      iconColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      href: '/products?category=A2+Dairy'
    },
    {
      title: 'High Protein',
      desc: 'Fresh malai paneer',
      icon: Dumbbell,
      iconColor: 'text-orange-700 bg-orange-50 border-orange-200',
      href: '/products?category=A2+Dairy'
    },
    {
      title: 'Vedic Energy',
      desc: 'Bilona A2 Desi Ghee',
      icon: Zap,
      iconColor: 'text-amber-700 bg-amber-50 border-amber-200',
      href: '/products?category=A2+Dairy'
    },
    {
      title: 'Kids Growth',
      desc: 'A2 Beta-Casein milk',
      icon: SmilePlus,
      iconColor: 'text-pink-700 bg-pink-50 border-pink-200',
      href: '/products?category=A2+Dairy'
    },
    {
      title: 'Bone Strength',
      desc: 'Pure calcium boost',
      icon: ShieldCheck,
      iconColor: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      href: '/products?category=A2+Dairy'
    },
    {
      title: '100% Organic',
      desc: 'Zero chemicals or hormones',
      icon: Sparkles,
      iconColor: 'text-lime-700 bg-lime-50 border-lime-200',
      href: '/products'
    }
  ];

  // Deal items
  const dealProducts = products.slice(0, 4);
  const discounts = ['40% OFF', '35% OFF', '25% OFF', '30% OFF'];

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── LEFT COLUMN: DEAL OF THE DAY (7 cols) ── */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 md:p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          
          {/* Header & Countdown */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-2xl font-black text-[#0f3e26] tracking-tight">
                Deal of the Day
              </h2>
              <div className="flex items-center gap-1.5 bg-emerald-100/80 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-emerald-700 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Ends in {String(timeLeft.hours).padStart(2, '0')} : {String(timeLeft.minutes).padStart(2, '0')} : {String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>

            <Link href="/products" className="text-xs font-bold text-[#c88a23] hover:text-[#0f3e26] flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 4 Deal Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {dealProducts.map((prod, idx) => {
              const variant = prod.product_variants?.[0];
              const price = variant?.price ?? 199;
              const originalPrice = Math.round(price * (1 + (30 + idx * 5) / 100));

              return (
                <div 
                  key={prod.id} 
                  className="bg-gray-50/60 rounded-xl p-2.5 border border-gray-200/60 flex flex-col justify-between group hover:border-[#c88a23] hover:shadow-md transition-all"
                >
                  <div className="relative">
                    {/* Discount Badge */}
                    <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
                      {discounts[idx % discounts.length]}
                    </span>

                    {/* Image */}
                    <div className="w-full aspect-square bg-white rounded-lg p-2 flex items-center justify-center overflow-hidden mb-2">
                      <img 
                        src={prod.image_url || '/milk.png'} 
                        alt={prod.name} 
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-900 line-clamp-1 leading-snug">
                      {prod.name}
                    </h3>
                    <p className="text-[10px] text-gray-500 line-clamp-1 mb-1.5">
                      {variant?.weight || 'Standard Pack'}
                    </p>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-sm font-black text-[#0f3e26]">
                        ₹{price}
                      </span>
                      <span className="text-[10px] text-gray-400 line-through">
                        ₹{originalPrice}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mb-2">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-gray-700">4.{7 - idx}</span>
                      <span className="text-gray-400 font-normal">({85 + idx * 42})</span>
                    </div>

                    {/* Quick Add */}
                    <button
                      onClick={async () => {
                        if (!variant) return;
                        addToCartLocal(prod.id, variant.id, 1);
                        if (user) await addToCart(user.id, prod.id, variant.id, 1);
                      }}
                      className="w-full py-1.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* ── RIGHT COLUMN: OUR PURITY & QUALITY PROMISES (5 cols) ── */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 md:p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          
          {/* Header & Interactive Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-gray-100 mb-4 gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#c88a23] uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Customer Trust</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-[#0f3e26] tracking-tight">
                {activeTab === 'purity' ? 'Our Purity Promises' : 'Health & Wellness'}
              </h2>
            </div>

            {/* Switch Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('purity')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'purity' 
                    ? 'bg-[#0f3e26] text-white shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Purity
              </button>
              <button
                onClick={() => setActiveTab('wellness')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'wellness' 
                    ? 'bg-[#0f3e26] text-white shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Wellness
              </button>
            </div>
          </div>

          {/* Interactive Cards Grid */}
          {activeTab === 'purity' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5">
              {purityPromises.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-emerald-50/40 hover:border-emerald-300 transition-all group cursor-pointer"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${item.iconColor} group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-gray-900 group-hover:text-[#0f3e26] truncate">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 truncate font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5">
              {wellnessGoals.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-amber-50/40 hover:border-amber-300 transition-all group cursor-pointer"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${item.iconColor} group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-gray-900 group-hover:text-[#0f3e26] truncate">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 truncate font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer Trust Bar */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1.5 font-medium text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              100% Lab Tested & Adulteration Free
            </span>
            <Link 
              href="/profile/quality-reports" 
              className="text-[11px] font-bold text-[#c88a23] hover:text-[#0f3e26] flex items-center gap-1"
            >
              <span>View Lab Reports</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
