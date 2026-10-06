import 'server-only';

import { getAdminSupabase } from '@/lib/supabase/admin';
import type { ProductWithVariants } from './products';
import { legacyCategoryFilter } from '@/lib/constants/categories';

/**
 * Server-only catalogue reads.
 *
 * These use the Supabase *service-role* client and must never reach the
 * browser. They previously lived in `products.ts` alongside browser helpers
 * such as `getProducts()`. Because client components import that module
 * (useCartDetails -> Header -> root layout), webpack had to include the
 * Supabase SDK — ~180KB — in the shared chunk of every single page.
 *
 * The `server-only` import above makes that mistake a build error rather than
 * a silent performance (and security) regression.
 */
export async function getProductsServer(
  options: { category?: string; activeOnly?: boolean; q?: string; sellerId?: string } = {}
): Promise<ProductWithVariants[]> {
  try {
    const admin = getAdminSupabase();
    let query = admin
      .from('products')
      .select('*, product_variants(*)')
      .order('created_at', { ascending: false });

    if (options.category && options.category !== 'All' && options.category !== 'All Categories') {
      const cleanCat = options.category.replace(/-/g, ' ').trim();
      const legacy = legacyCategoryFilter(cleanCat);
      if (legacy) {
        query = query.or(legacy);
      } else {
        query = query.ilike('category', `%${cleanCat}%`);
      }
    }

    if (options.activeOnly !== false) {
      query = query.eq('is_active', true);
    }

    if (options.q) {
      query = query.or(`name.ilike.%${options.q}%,description.ilike.%${options.q}%`);
    }

    if (options.sellerId) {
      query = query.or(`seller_id.eq.${options.sellerId},created_by.eq.${options.sellerId}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ProductWithVariants[];
  } catch (error) {
    console.error('getProductsServer error:', error);
    return [];
  }
}

export async function getProductByIdServer(id: string): Promise<ProductWithVariants | null> {
  try {
    const admin = getAdminSupabase();
    const { data, error } = await admin
      .from('products')
      .select(`
        *,
        product_variants (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ProductWithVariants;
  } catch (error) {
    console.error('getProductByIdServer error:', error);
    return null;
  }
}
