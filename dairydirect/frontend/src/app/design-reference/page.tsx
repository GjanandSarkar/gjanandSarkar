import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/shared/ProductCard';
import {
  ProductGridSkeleton,
  ProductCardSkeleton,
  ListSkeleton,
  CategoryRailSkeleton,
} from '@/components/shared/Skeletons';
import { CATEGORIES, categoryColors } from '@/lib/constants/categories';
import { CategoryIcon } from '@/components/shared/CategoryIcon';
import type { CatalogProduct } from '@/lib/types/catalog';

/**
 * Internal design reference. Not part of the storefront.
 *
 * The product surfaces can only be reviewed with data in them, and a local
 * environment has none. This renders every listing state side by side —
 * normal, discounted, unrated, low stock, sold out, loading — so the design
 * can be checked without seeding a database.
 *
 * Returns 404 outside development, so it costs nothing in production and
 * cannot be reached by customers.
 */
function sample(over: Partial<CatalogProduct> & { id: string; name: string }): CatalogProduct {
  return {
    category: 'Groceries',
    image_url: null,
    brand: 'Sample Brand Pvt Ltd',
    rating: null,
    reviews_count: 0,
    product_variants: [
      { id: `${over.id}-v1`, weight: '500 g', price: 249, original_price: null, stock: 50 },
    ],
    ...over,
  };
}

const samples: Array<{ label: string; note: string; product: CatalogProduct }> = [
  {
    label: 'Standard',
    note: 'No reviews yet, so no rating is shown. No original price, so no strikethrough.',
    product: sample({ id: 'a', name: 'Stainless Steel Pressure Cooker 3L' }),
  },
  {
    label: 'Genuine discount',
    note: 'original_price is real and higher, so the % badge and strikethrough appear.',
    product: sample({
      id: 'b',
      name: 'Cold-Pressed Groundnut Oil',
      category: 'Cold-Pressed Oils',
      brand: 'Ghani Foods',
      product_variants: [
        { id: 'b-v1', weight: '1 L', price: 420, original_price: 560, stock: 30 },
      ],
    }),
  },
  {
    label: 'Rated',
    note: 'reviews_count > 0, so the real rating renders in the green pill.',
    product: sample({
      id: 'c',
      name: 'Organic Turmeric Powder',
      category: 'Spices & Masalas',
      brand: 'Nilgiri Spice Co',
      rating: 4.3,
      reviews_count: 182,
      product_variants: [
        { id: 'c-v1', weight: '200 g', price: 160, original_price: 199, stock: 8 },
      ],
    }),
  },
  {
    label: 'Low stock',
    note: 'Stock at or below 10 surfaces an urgency badge.',
    product: sample({
      id: 'd',
      name: 'Handloom Cotton Bedsheet',
      category: 'Handloom & Fashion',
      brand: 'Weaves of Bharat',
      rating: 4.8,
      reviews_count: 41,
      product_variants: [
        { id: 'd-v1', weight: 'Queen', price: 1899, original_price: null, stock: 4 },
      ],
    }),
  },
  {
    label: 'Sold out',
    note: 'Image desaturates, badge shows, action disables.',
    product: sample({
      id: 'e',
      name: 'Brass Pooja Thali Set',
      category: 'Pooja & Spiritual',
      brand: 'Moradabad Metalworks',
      product_variants: [
        { id: 'e-v1', weight: '9 inch', price: 1299, original_price: null, stock: 0 },
      ],
    }),
  },
  {
    label: 'Multi-variant',
    note: 'Several weights, so the action opens the variant drawer.',
    product: sample({
      id: 'f',
      name: 'A2 Desi Cow Ghee',
      category: 'Dairy',
      brand: 'Gir Gaushala Foods',
      rating: 4.6,
      reviews_count: 903,
      product_variants: [
        { id: 'f-v1', weight: '250 ml', price: 649, original_price: 799, stock: 20 },
        { id: 'f-v2', weight: '500 ml', price: 1249, original_price: 1499, stock: 12 },
        { id: 'f-v3', weight: '1 L', price: 2399, original_price: null, stock: 5 },
      ],
    }),
  },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <h2 className="text-lg font-black text-[#0f3e26] tracking-tight">{title}</h2>
      <p className="text-xs text-gray-500 mt-1 mb-5 max-w-2xl leading-relaxed">{description}</p>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  return (
    <div className="min-h-screen bg-[#fafaf8] px-5 md:px-10 py-10 max-w-[1280px] mx-auto">
      <header className="mb-12">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c88a23]">
          Internal · development only
        </span>
        <h1 className="text-3xl font-black text-[#0f3e26] tracking-tight mt-1">
          Design reference
        </h1>
        <p className="text-sm text-gray-600 mt-2 max-w-2xl leading-relaxed">
          Every listing state rendered with sample data. This route 404s outside
          development.
        </p>
      </header>

      <Section
        title="Product card states"
        description="Hover for the lift, press for the tap response, and tab through to see focus rings. Ratings only appear where reviews exist; strikethrough prices only where a real original price exists."
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 reveal">
          {samples.map((s) => (
            <div key={s.product.id} className="flex flex-col">
              <ProductCard product={s.product} />
              <div className="mt-2 px-1">
                <p className="text-[10px] font-black text-[#0f3e26] uppercase tracking-wide">
                  {s.label}
                </p>
                <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{s.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Loading skeletons"
        description="Layout-matched placeholders that replaced centred spinners. They reserve the exact final dimensions, so nothing shifts when data lands."
      >
        <div className="space-y-8">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-3">
              Category rail
            </p>
            <CategoryRailSkeleton />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-3">
              Product grid
            </p>
            <ProductGridSkeleton count={4} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-3">
              List rows
            </p>
            <ListSkeleton rows={3} />
          </div>
          <div className="max-w-[200px]">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-3">
              Single card
            </p>
            <ProductCardSkeleton />
          </div>
        </div>
      </Section>

      <Section
        title="Category taxonomy"
        description="All 12 categories with their shared icon and accent colour. Previously four separate dairy-only maps meant most of these rendered with no icon and the same pale green tint."
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 reveal">
          {CATEGORIES.map((c) => {
            const color = categoryColors(c.name);
            return (
              <div
                key={c.key}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-200/90 lift pressable"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: color.bg, color: color.color }}
                >
                  <CategoryIcon name={c.icon} className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-800 text-center leading-tight">
                  {c.name}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        title="Motion and interaction"
        description="All CSS, so none of this adds JavaScript. Everything below collapses to an instant state change under prefers-reduced-motion."
      >
        <div className="flex flex-wrap gap-3">
          {[
            ['lift', 'Card hover elevation'],
            ['pressable', 'Tap scale response'],
            ['pop', 'Value change emphasis'],
            ['flash-success', 'Add-to-cart confirmation'],
          ].map(([cls, label]) => (
            <div
              key={cls}
              className={`px-5 py-4 rounded-2xl bg-white border border-gray-200/90 ${cls}`}
            >
              <p className="text-xs font-black text-[#0f3e26]">{label}</p>
              <code className="text-[10px] text-gray-500">.{cls}</code>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
