import { ProductRow } from '@/components/catalog/ProductRow';
import type { CatalogProduct } from '@/lib/types/catalog';

interface ProductListProps {
  products: CatalogProduct[];
  title?: string;
  /** Small muted line under the title. Say what the list actually is. */
  subtitle?: string;
  priorityCount?: number;
}

/**
 * A list of products as one continuous surface split by hairlines.
 *
 * Deliberately not a grid of cards. Separate cards repeat the same border,
 * radius and shadow for every product, which is a lot of visual noise in
 * service of no information. One surface with dividers reads as a single
 * scannable list, which is how an app behaves and how people actually shop
 * on a phone.
 */
export function ProductList({
  products,
  title,
  subtitle,
  priorityCount = 3,
}: ProductListProps) {
  if (products.length === 0) return null;

  return (
    <section className="w-full">
      {title ? (
        <header className="flex items-baseline justify-between px-4 pb-2 pt-5">
          <h2 className="text-[17px] font-bold tracking-tight text-foreground">{title}</h2>
          {subtitle ? (
            <span className="text-[11.5px] text-foreground-muted">{subtitle}</span>
          ) : null}
        </header>
      ) : null}

      {/* divide-y draws exactly one hairline between rows and none at the
          ends, so the list never gets a stray line against the page edge. */}
      <div className="divide-y divide-border border-y border-border bg-surface">
        {products.map((product, i) => (
          <ProductRow key={product.id} product={product} priority={i < priorityCount} />
        ))}
      </div>
    </section>
  );
}
