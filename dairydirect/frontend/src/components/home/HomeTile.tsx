import Image from 'next/image';
import Link from 'next/link';

interface TileImage {
  src: string | null;
  label: string;
  href: string;
}

interface HomeTileProps {
  title: string;
  /** Up to four images, rendered as Amazon's 2x2 quadrant. */
  images: TileImage[];
  ctaLabel: string;
  ctaHref: string;
}

/**
 * White content tile — the unit Amazon's front page is built from.
 *
 * A tile is navigation dressed as merchandising: heading, four tappable
 * thumbnails into subsets of the catalogue, and a link out to the full
 * list. It earns its space because every pixel in it is a destination,
 * unlike a hero banner where only one thing is clickable.
 *
 * Four images, not three or five: a 2x2 quadrant stays square at any
 * column width, so a row of tiles keeps a flat baseline on every screen.
 */
export function HomeTile({ title, images, ctaLabel, ctaHref }: HomeTileProps) {
  const quad = images.slice(0, 4);
  if (quad.length === 0) return null;

  return (
    <section className="flex flex-col rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-[17px] font-bold leading-tight text-foreground">{title}</h2>

      <div className="grid grid-cols-2 gap-2.5">
        {quad.map((img) => (
          <Link
            key={img.href + img.label}
            href={img.href}
            className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-muted">
              {img.src ? (
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 22vw, 12vw"
                  /* contain, matching the cards: a cropped thumbnail of a
                     tall bottle or a wide bag shows neither. */
                  className="object-contain p-1"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary-fixed">
                  <span className="text-base font-bold text-primary">
                    {img.label.trim().charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-1 truncate text-[11.5px] text-foreground-muted group-hover:underline">
              {img.label}
            </p>
          </Link>
        ))}
      </div>

      {/* mt-auto keeps the link on the bottom edge so every tile in a row
          ends at the same line regardless of heading length. */}
      <Link
        href={ctaHref}
        className="mt-auto pt-3 text-[12.5px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {ctaLabel}
      </Link>
    </section>
  );
}
