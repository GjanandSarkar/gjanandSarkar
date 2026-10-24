/**
 * ImageKit URL transforms for next/image.
 *
 * Product photography is uploaded at whatever resolution the seller happened
 * to have, frequently 2000px+ and several hundred KB. Rendering that into a
 * 160px grid thumbnail on a phone wastes most of the bytes on a connection
 * that can least afford them, and image weight is the single largest cost on
 * a catalogue page.
 *
 * ImageKit can resize and re-encode at the edge, so the right fix is to ask
 * it for exactly the width we are going to paint. We route through ImageKit's
 * own CDN rather than Next's optimiser because the assets already live there:
 * it avoids a second copy, a second cache and per-image serverless cost on
 * Vercel.
 *
 * Anything not hosted on ImageKit (Supabase storage, remote seller URLs) is
 * returned untouched so it still renders correctly.
 */

const IMAGEKIT_HOST = 'imagekit.io';

/** Is this a URL ImageKit can transform? */
export function isImageKitUrl(src: string): boolean {
  if (!src) return false;
  try {
    return new URL(src).hostname.endsWith(IMAGEKIT_HOST);
  } catch {
    return false;
  }
}

export interface IkTransformOptions {
  width?: number;
  /** 1-100. ImageKit defaults to 80, which is a sensible floor for photos. */
  quality?: number;
  /** Serve AVIF/WebP when the browser advertises support. */
  auto?: boolean;
}

/**
 * Append (or merge into) ImageKit's `tr` query parameter.
 *
 * Uses `tr` as a query param rather than a path segment because the path form
 * breaks when the URL already carries a signature or a version token.
 */
export function ikUrl(src: string, opts: IkTransformOptions = {}): string {
  if (!isImageKitUrl(src)) return src;

  const { width, quality = 80, auto = true } = opts;

  try {
    const url = new URL(src);
    const parts: string[] = [];

    if (width) parts.push(`w-${Math.round(width)}`);
    parts.push(`q-${Math.max(1, Math.min(100, Math.round(quality)))}`);
    // f-auto lets ImageKit pick AVIF or WebP per Accept header.
    if (auto) parts.push('f-auto');
    // Never upscale past the source; it only adds bytes.
    parts.push('c-at_max');

    const existing = url.searchParams.get('tr');
    url.searchParams.set('tr', existing ? `${existing},${parts.join(',')}` : parts.join(','));
    return url.toString();
  } catch {
    return src;
  }
}

/**
 * next/image-compatible loader.
 *
 * next/image calls this once per entry in its width set, which is what
 * produces a real srcset instead of one oversized file for every viewport.
 */
export function imagekitLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  return ikUrl(src, { width, quality: quality ?? 80 });
}
