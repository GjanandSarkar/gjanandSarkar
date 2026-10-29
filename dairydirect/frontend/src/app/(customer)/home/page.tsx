import { getHomeFeed } from '@/lib/api/home';
import { CatalogGrid } from '@/components/catalog/CatalogGrid';
import { HomeTile } from '@/components/home/HomeTile';
import { OneBrandPerCategorySection } from '@/components/home/OneBrandPerCategorySection';
import { RecommendationRail } from '@/components/discovery/RecommendationRail';
import { AdSlot } from '@/components/discovery/AdSlot';
import { HeritageBanner } from '@/components/home/HeritageBanner';
import { WhyGjanandSarkar } from '@/components/home/WhyGjanandSarkar';
import { isSectionEnabled } from '@/lib/config/launch';
import { VISIBLE_CATEGORIES } from '@/lib/constants/categories';
import type { CatalogProduct } from '@/lib/types/catalog';

export const revalidate = 300;

/**
 * Builds the tile row from real catalogue contents.
 *
 * Tiles are generated from products that actually exist rather than from a
 * fixed list of categories, so the homepage can never advertise a category
 * that would open onto an empty page.
 */
function buildTiles(products: CatalogProduct[]) {
  return VISIBLE_CATEGORIES.map((category) => {
    const inCategory = products.filter((p) => p.category === category.name);
    if (inCategory.length === 0) return null;

    return {
      key: category.key,
      title: category.description || category.name,
      ctaLabel: `Shop ${category.name}`,
      ctaHref: `/products?category=${encodeURIComponent(category.name)}`,
      images: inCategory.slice(0, 4).map((p) => ({
        src: p.image_url,
        label: p.name,
        href: `/products/${p.id}`,
      })),
    };
  }).filter((t): t is NonNullable<typeof t> => t !== null);
}

export default async function HomeScreen() {
  const prods = await getHomeFeed();
  const tiles = buildTiles(prods).slice(0, 4);

  return (
    /* The grey page is the point: every block below is a white card sitting
       on it, which is what separates sections without a single shadow or
       divider line. */
    <div className="w-full overflow-x-hidden bg-background">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-3 py-4 md:px-4">
        {/* 1. Tile row. Navigation dressed as merchandising: every thumbnail
               is a destination, unlike a hero banner where one thing is
               clickable and the rest is wallpaper. */}
        {tiles.length > 0 && (
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((tile) => (
              <HomeTile
                key={tile.key}
                title={tile.title}
                images={tile.images}
                ctaLabel={tile.ctaLabel}
                ctaHref={tile.ctaHref}
              />
            ))}
          </div>
        )}

        {/* 2. The catalogue itself, in a uniform grid. */}
        <CatalogGrid products={prods} title="Fresh picks for you" />

        {/* 3. Supporting blocks, each its own white card on the grey page. */}
        <RecommendationRail placement="home" limit={8} />

        <OneBrandPerCategorySection />

        <AdSlot placement="home" />
      </div>

      {isSectionEnabled('heritageBanner') && <HeritageBanner />}
      {isSectionEnabled('whyGjanandSarkar') && <WhyGjanandSarkar />}
    </div>
  );
}
