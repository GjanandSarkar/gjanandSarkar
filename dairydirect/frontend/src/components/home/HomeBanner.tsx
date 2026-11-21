import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { CatalogProduct } from '@/lib/types/catalog';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

/**
 * The only promotional surface on the homepage.
 *
 * One promise, one sentence of proof, two actions. No eyebrow pill, no badge
 * row, no carousel of five competing banners — the old hero occupied most of a
 * phone screen before a single product appeared.
 */
export function HomeBanner({ product }: { product?: CatalogProduct }) {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-6 pt-4">
      <div className="relative overflow-hidden rounded-2xl bg-primary-fixed">
        <div className="flex items-center gap-4 px-5 py-5 sm:px-8 sm:py-7">
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] sm:text-[30px] font-extrabold leading-[1.12] tracking-[-0.02em] text-foreground">
              Milk before <span className="text-primary">your alarm.</span>
            </h1>
            <p className="mt-1.5 text-[12px] sm:text-[13px] font-medium leading-relaxed text-foreground/70 max-w-md">
              A2 milk, curd, paneer and ghee from one verified dairy. Bottled at dawn, at your door 5–9 AM.
            </p>
            <div className="mt-3.5 flex items-center gap-2">
              <Link
                href="/subscribe/new"
                className="inline-flex items-center gap-1.5 h-10 rounded-xl bg-primary px-4 text-[12px] font-extrabold text-on-primary hover:bg-primary-hover"
              >
                Build a plan
                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center h-10 rounded-xl border border-primary/25 bg-surface/70 px-4 text-[12px] font-extrabold text-primary hover:bg-surface"
              >
                Shop dairy
              </Link>
            </div>
          </div>

          {product?.image_url && (
            <div className="relative hidden sm:block w-[132px] h-[132px] shrink-0 rounded-full bg-surface/70 overflow-hidden">
              <Image
                src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                alt=""
                fill
                sizes="132px"
                priority
                className="object-contain p-3"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
