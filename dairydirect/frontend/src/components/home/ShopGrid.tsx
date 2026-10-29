import { ProductCard } from '@/components/shared/ProductCard';
import type { CatalogProduct } from '@/lib/types/catalog';

interface ShopGridProps {
  products: CatalogProduct[];
  title?: string;
  /** Marks the first row as LCP candidates so they decode early. */
  priorityCount?: number;
}

/**
 * The homepage's main product grid.
 *
 * Deliberately a plain grid rather than a carousel. A horizontal rail hides
 * most of its contents behind a swipe and shows roughly two products per
 * screen; a grid shows four to six and lets the customer scan. Since
 * "products first" is the whole brief, the grid wins.
 *
 * Two columns on the smallest phones: one column makes every product feel
 * like a decision, and a 2-up grid is what Indian shoppers are trained on.
 */
export function ShopGrid({ products, title, priorityCount = 4 }: ShopGridProps) {
  if (products.length === 0) return null;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
      {title ? (
        <h2 className="mb-3 text-lg font-bold tracking-tight text-foreground md:text-xl">
          {title}
        </h2>
      ) : null}

      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product, index) => (
          <div key={product.id} className="rise-in">
            <ProductCard product={product} priority={index < priorityCount} />
          </div>
        ))}
      </div>
    </section>
  );
}
