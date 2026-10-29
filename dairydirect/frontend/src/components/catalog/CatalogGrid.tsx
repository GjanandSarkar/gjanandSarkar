import { CatalogCard } from '@/components/catalog/CatalogCard';
import type { CatalogProduct } from '@/lib/types/catalog';

interface CatalogGridProps {
  products: CatalogProduct[];
  title?: string;
  priorityCount?: number;
}

/**
 * Uniform product grid.
 *
 * Column counts are chosen so a card never gets wide enough for its
 * contained image to look lost in whitespace: two up on a phone, climbing
 * to six on a desktop. `items-stretch` plus the card's own `mt-auto` keeps
 * every Add to cart button on a shared baseline across each row.
 */
export function CatalogGrid({ products, title, priorityCount = 6 }: CatalogGridProps) {
  if (products.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      {title ? (
        <h2 className="mb-3 text-[19px] font-bold tracking-tight text-foreground">{title}</h2>
      ) : null}

      <div className="grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {products.map((product, i) => (
          <CatalogCard key={product.id} product={product} priority={i < priorityCount} />
        ))}
      </div>
    </section>
  );
}
