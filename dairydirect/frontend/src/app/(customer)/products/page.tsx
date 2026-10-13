import type { Metadata } from 'next';
import { getCatalog } from '@/lib/api/home';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: 'All Products',
  description:
    'Browse every verified Indian product on Gjanand Sarkar — one trusted brand per category, delivered across India.',
};

/**
 * The catalogue listing is now server-rendered and cached (5 min, busted on
 * any product change via `revalidateTag('products')`).
 *
 * It used to be a pure client component: the user got a blank skeleton, then
 * React hydrated, then the browser fetched the entire catalogue over the
 * network, and only then did a single product appear. That round-trip was
 * also invisible to search engines, so none of these product listings could
 * rank.
 *
 * Interactive filtering/sorting still happens in the client component below —
 * it just starts with real data instead of an empty array.
 */
export const revalidate = 300;

export default async function ProductsPage() {
  const products = await getCatalog();
  return <ProductsClient initialProducts={products} />;
}
