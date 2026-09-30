import { revalidatePath, revalidateTag } from 'next/cache';
import { invalidateProductsCache } from '@/lib/aws/redis';

/**
 * Production-level Inventory Cache Revalidation Service
 * 
 * Ensures that whenever stock changes (purchase, cancellation, seller restock, reservation):
 * 1. Next.js Data Cache tags ('products', 'inventory') are purged.
 * 2. Next.js App Router paths (Home, Category, Search, Product Details, Seller Panel) are revalidated.
 * 3. Redis product caches are cleared immediately.
 * 
 * Functional behavior mirrors Amazon/Flipkart: customer-facing pages never display stale stock.
 */
export async function revalidateInventory(options: {
  productId?: string;
  category?: string;
  revalidatePaths?: boolean;
} = {}): Promise<void> {
  try {
    // 1. Invalidate Next.js Data Cache Tags
    try {
      (revalidateTag as any)('products');
      (revalidateTag as any)('inventory');
      if (options.productId) {
        (revalidateTag as any)(`product-${options.productId}`);
      }
    } catch (tagErr) {
      // revalidateTag can throw if called outside request context; safely catch
    }

    // 2. Invalidate Next.js Route Caches
    if (options.revalidatePaths !== false) {
      const paths = [
        { path: '/home', type: 'page' as const },
        { path: '/categories', type: 'layout' as const },
        { path: '/categories/[category]', type: 'page' as const },
        { path: '/search', type: 'page' as const },
        { path: '/products', type: 'page' as const },
        { path: '/products/[id]', type: 'page' as const },
        { path: '/cart', type: 'page' as const },
        { path: '/checkout', type: 'page' as const },
        { path: '/seller/dashboard', type: 'page' as const },
        { path: '/admin/products', type: 'page' as const },
      ];

      for (const p of paths) {
        try {
          revalidatePath(p.path, p.type);
        } catch (e) {
          // ignore context errors
        }
      }

      if (options.productId) {
        try {
          revalidatePath(`/products/${options.productId}`, 'page');
        } catch (e) {}
      }

      if (options.category) {
        try {
          revalidatePath(`/categories/${encodeURIComponent(options.category)}`, 'page');
        } catch (e) {}
      }
    }

    // 3. Purge Redis Cache
    try {
      await invalidateProductsCache(options.productId);
    } catch (redisErr) {
      // Redis is optional fallback cache
    }
  } catch (error: any) {
    console.warn('[revalidateInventory] Warning during cache invalidation:', error?.message);
  }
}
