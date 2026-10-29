import type { CatalogProduct } from '@/lib/types/catalog';

/**
 * Demo catalogue for design review.
 *
 * WHY THIS EXISTS
 * ---------------
 * The preview sandbox has no Supabase credentials, so every catalogue query
 * fails, `getHomeFeed` degrades to an empty array, and the storefront renders
 * as a blank page. That is correct behaviour in production — the homepage
 * must survive a database outage — but it makes the UI impossible to look at.
 *
 * SAFETY
 * ------
 * This data is only ever reachable when DEMO_CATALOGUE is explicitly set to
 * '1' AND the real query came back empty. The variable does not exist in
 * production, so a real deployment can never serve these rows: a live site
 * with a broken database still shows an empty state, not invented products.
 */

export function isDemoCatalogueEnabled(): boolean {
  return process.env.DEMO_CATALOGUE === '1';
}

const img = (id: string, w = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const DEMO_PRODUCTS: CatalogProduct[] = [
  {
    id: 'demo-purse-01',
    name: 'Hand Embroidered Cotton Purse',
    category: 'Handmade',
    brand: 'Kutch Craft Collective',
    image_url: img('photo-1584917865442-de89df76afd3'),
    rating: 4.6,
    reviews_count: 38,
    product_variants: [
      { id: 'demo-purse-01-v1', weight: 'Small', price: 649, original_price: 899, stock: 12 },
      { id: 'demo-purse-01-v2', weight: 'Large', price: 899, original_price: null, stock: 4 },
    ],
  },
  {
    id: 'demo-purse-02',
    name: 'Handwoven Jute Shoulder Bag',
    category: 'Handmade',
    brand: 'Kutch Craft Collective',
    image_url: img('photo-1548036328-c9fa89d128fa'),
    rating: 4.3,
    reviews_count: 11,
    product_variants: [
      { id: 'demo-purse-02-v1', weight: 'One size', price: 1250, original_price: 1600, stock: 7 },
    ],
  },
  {
    id: 'demo-milk-01',
    name: 'A2 Gir Cow Fresh Milk',
    category: 'Dairy',
    brand: 'Gjanand Farm',
    image_url: img('photo-1563636619-e9143da7973b'),
    rating: 4.8,
    reviews_count: 214,
    product_variants: [
      { id: 'demo-milk-01-v1', weight: '500 ml', price: 45, original_price: null, stock: 40 },
      { id: 'demo-milk-01-v2', weight: '1 L', price: 85, original_price: 95, stock: 25 },
    ],
  },
  {
    id: 'demo-ghee-01',
    name: 'Vedic Bilona Cow Ghee',
    category: 'Dairy',
    brand: 'Gjanand Farm',
    image_url: img('photo-1631452180519-c014fe946bc7'),
    rating: 4.9,
    reviews_count: 97,
    product_variants: [
      { id: 'demo-ghee-01-v1', weight: '500 ml', price: 899, original_price: 1050, stock: 3 },
    ],
  },
  {
    id: 'demo-paneer-01',
    name: 'Fresh Malai Paneer',
    category: 'Dairy',
    brand: 'Gjanand Farm',
    image_url: img('photo-1631452180775-9e6f0b1b0b0a'),
    rating: 0,
    reviews_count: 0,
    product_variants: [
      { id: 'demo-paneer-01-v1', weight: '200 g', price: 95, original_price: null, stock: 0 },
    ],
  },
  {
    id: 'demo-curd-01',
    name: 'Set Dahi Natural Curd',
    category: 'Dairy',
    brand: 'Gjanand Farm',
    image_url: img('photo-1488477181946-6428a0291777'),
    rating: 4.2,
    reviews_count: 56,
    product_variants: [
      { id: 'demo-curd-01-v1', weight: '400 g', price: 60, original_price: 75, stock: 18 },
    ],
  },
];
