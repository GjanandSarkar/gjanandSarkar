import React from 'react';
import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { getProductsServer } from '@/lib/api/products.server';
import { ProductCard } from '@/components/shared/ProductCard';
import { CATEGORIES, categoryColors, categoryHref } from '@/lib/constants/categories';
import { CategoryIcon } from '@/components/shared/CategoryIcon';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const title = q
    ? `Search results for “${q}”`
    : category
      ? category
      : 'All products';
  return {
    title,
    // Search result pages are thin, duplicate-prone and infinite in number;
    // they should not be indexed.
    robots: { index: false, follow: true },
  };
}

/** Recovery paths shown when a search returns nothing. */
function CategorySuggestions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 reveal">
      {CATEGORIES.slice(0, 6).map((c) => {
        const color = categoryColors(c.name);
        return (
          <Link
            key={c.key}
            href={categoryHref(c)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-200/90 lift pressable"
          >
            <span
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: color.bg, color: color.color }}
            >
              <CategoryIcon name={c.icon} className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-bold text-gray-800 text-center leading-tight">
              {c.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || '';
  const category = params.category || '';
  const products = await getProductsServer({ q, category, activeOnly: true });

  const heading = q
    ? `Results for “${q}”`
    : category
      ? category
      : 'All products';

  return (
    <div className="w-full bg-[#fafaf8] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 pt-24 md:pt-32">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {heading}
          </h1>
          {/* A result count was missing entirely, so there was no way to tell
              a narrow result set from a broken query. */}
          {products.length > 0 && (
            <p className="text-xs font-semibold text-gray-500 mt-1 tabular-nums">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
          )}
        </header>

        {products.length === 0 ? (
          /* The empty state was a dead end: a grey box saying "No products
             found" with no way forward. Every zero-result search ended the
             session. It now offers real routes back into the catalogue. */
          <div className="bg-white rounded-2xl border border-gray-200/90 p-8 md:p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <SearchX className="w-7 h-7 text-gray-400" />
              </div>
              <h2 className="text-base font-black text-gray-900 mb-1.5">
                {q ? `No matches for “${q}”` : 'Nothing here yet'}
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Check the spelling, try a shorter or more general term, or
                browse a category below.
              </p>
              <Link
                href="/products"
                className="inline-block mt-5 px-5 py-2.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold rounded-xl pressable"
              >
                Browse all products
              </Link>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 text-center">
                Or explore a category
              </p>
              <CategorySuggestions />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 reveal">
            {products.map((p, i) => (
              // The first row is above the fold on every viewport, so those
              // images get fetch priority instead of lazy-loading.
              <ProductCard key={p.id} product={p} priority={i < 5} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
