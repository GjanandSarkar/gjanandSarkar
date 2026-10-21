import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES, categoryHref } from '@/lib/constants/categories';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import { ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Explore All Categories | Gjanand Sarkar',
  description: 'Browse authentic farm-fresh dairy, cold-pressed oils, groceries, spices, ayurveda and spiritual essentials.',
};

// Group categories into intuitive customer shopping departments
const DEPARTMENT_GROUPS = [
  {
    id: 'dairy-breakfast',
    title: 'Farm-Fresh Dairy & Essentials',
    subtitle: '100% Lab-Tested Gir Cow A2 & Bilona Ghee',
    categories: ['Dairy'],
    subItems: [
      { name: 'Gir Cow A2 Milk', slug: 'dairy', query: 'milk', badge: '6:30 AM Slot' },
      { name: 'Vedic Bilona Ghee', slug: 'dairy', query: 'ghee', badge: 'Bestseller' },
      { name: 'Fresh Malai Paneer', slug: 'dairy', query: 'paneer', badge: 'Fresh Daily' },
      { name: 'Traditional Dahi & Curd', slug: 'dairy', query: 'curd', badge: 'Farm Made' },
      { name: 'Cultured Chaas', slug: 'dairy', query: 'buttermilk', badge: 'Pure' },
    ],
  },
  {
    id: 'groceries-pantry',
    title: 'Groceries, Staples & Oils',
    subtitle: 'Naturally Grown Grains, Pulses & Wood-Pressed Oils',
    categories: ['Groceries', 'Cold-Pressed Oils', 'Spices & Masalas'],
    subItems: [
      { name: 'Mustard & Sesame Oils', slug: 'cold-pressed-oils', query: 'oil', badge: 'Wood Pressed' },
      { name: 'Desi Wheat & Atta', slug: 'groceries', query: 'wheat', badge: 'Unpolished' },
      { name: 'Organic Pulses & Dals', slug: 'groceries', query: 'dal', badge: 'Chemical Free' },
      { name: 'Whole & Ground Spices', slug: 'spices-and-masalas', query: 'spice', badge: 'Aromatic' },
      { name: 'Raw Forest Honey', slug: 'groceries', query: 'honey', badge: 'Wild Sourced' },
    ],
  },
  {
    id: 'ayurveda-wellness',
    title: 'Ayurveda & Daily Wellness',
    subtitle: 'Classical Formulations, Immunity & Pure Herbs',
    categories: ['Ayurveda & Wellness', 'Beauty & Personal Care'],
    subItems: [
      { name: 'A2 Ghee Chyawanprash', slug: 'ayurveda-and-wellness', query: 'chyawanprash', badge: 'Authentic' },
      { name: 'Herbal Teas & Kadha', slug: 'ayurveda-and-wellness', query: 'tea', badge: 'Immunity' },
      { name: 'Pure Shilajit & Ashwagandha', slug: 'ayurveda-and-wellness', query: 'herbs', badge: 'Lab Tested' },
      { name: 'Ayurvedic Bath & Ubtan', slug: 'beauty-and-personal-care', query: 'ubtan', badge: 'Natural' },
    ],
  },
  {
    id: 'pooja-culture',
    title: 'Pooja, Spiritual & Handicrafts',
    subtitle: 'Pure Ghee Diyas, Brass Aarti & Handcrafted Decor',
    categories: ['Pooja & Spiritual', 'Handicrafts & Decor', 'Handloom & Fashion'],
    subItems: [
      { name: 'Pure Cow Dung Diyas', slug: 'pooja-and-spiritual', query: 'diya', badge: 'Vedic' },
      { name: 'Bhimseni Camphor & Dhoop', slug: 'pooja-and-spiritual', query: 'camphor', badge: 'Pure' },
      { name: 'Brass Puja Vessels', slug: 'handicrafts-and-decor', query: 'brass', badge: 'Handmade' },
      { name: 'Khadi & Handloom Wear', slug: 'handloom-and-fashion', query: 'handloom', badge: 'Artisanal' },
    ],
  },
  {
    id: 'home-lifestyle',
    title: 'Home, Cookware & Books',
    subtitle: 'Clay Pots, Cast Iron & Vedic Literature',
    categories: ['Home & Kitchen', 'Books & Stationery', 'Electronics'],
    subItems: [
      { name: 'Clay & Terracotta Cookware', slug: 'home-and-kitchen', query: 'clay', badge: 'Traditional' },
      { name: 'Cast Iron Kadai & Tawa', slug: 'home-and-kitchen', query: 'cast iron', badge: 'Heavy Duty' },
      { name: 'Vedic & Heritage Books', slug: 'books-and-stationery', query: 'books', badge: 'Wisdom' },
    ],
  },
];

export default function CategoriesHubScreen() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-28 md:pb-12 transition-colors duration-150">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-5 space-y-8">
        
        {/* ── Quick Discovery Visual Grid (All 12 Canonical Categories) ── */}
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Explore Departments
            </h2>
            <span className="text-xs font-medium text-foreground-muted">
              {CATEGORIES.length} Categories
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                href={categoryHref(cat)}
                className="group flex flex-col items-center p-3 rounded-xl bg-surface border border-border hover:border-primary/50 shadow-2xs transition-all active:scale-95 text-center"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-surface-muted group-hover:bg-primary-fixed border border-border/60 flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-105">
                  <CategoryIcon name={cat.icon} className="w-7 h-7 text-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
                  {cat.name}
                </h3>
                {cat.badge && (
                  <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary-fixed px-1.5 py-0.5 rounded">
                    {cat.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Detailed Department Shelves (Blinkit / Amazon Layout) ── */}
        <div className="space-y-6">
          {DEPARTMENT_GROUPS.map((dept) => (
            <section
              key={dept.id}
              className="bg-surface rounded-xl border border-border p-4 sm:p-6 shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-border/60 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                    {dept.title}
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    {dept.subtitle}
                  </p>
                </div>
                <Link
                  href={`/products?category=${encodeURIComponent(dept.categories[0])}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 group"
                >
                  <span>See All</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Sub-item curated shopping tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3.5">
                {dept.subItems.map((item, idx) => (
                  <Link
                    key={`${dept.id}-${idx}`}
                    href={`/search?search=${encodeURIComponent(item.query)}`}
                    className="flex flex-col p-3 rounded-lg bg-surface-muted/60 hover:bg-surface-elevated border border-border hover:border-primary/50 transition-all active:scale-95 group text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-primary bg-primary-fixed px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                      <ArrowRight className="w-3 h-3 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-foreground-muted mt-1 font-medium">
                      Browse products →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ── Quality Assurance Trust Strip ── */}
        <div className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Single Verified Brand Per Category</p>
              <p className="text-[11px] text-foreground-muted">70+ lab test parameters • Direct farm sourcing without middlemen</p>
            </div>
          </div>
          <Link
            href="/about"
            className="text-xs font-semibold text-primary hover:underline whitespace-nowrap"
          >
            Learn About Our Standards →
          </Link>
        </div>

      </div>
    </div>
  );
}
