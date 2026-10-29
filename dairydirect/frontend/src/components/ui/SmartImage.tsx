"use client";

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { imagekitLoader, isImageKitUrl } from '@/lib/images/imagekit';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

/**
 * The single image component for anything user-uploaded.
 *
 * Most of the app rendered raw <img> tags, which means: no responsive
 * srcset, no modern format negotiation, no lazy loading below the fold and
 * no reserved space, so every image both cost more bytes than it needed and
 * shifted the layout as it arrived.
 *
 * This wraps next/image and adds the three things that were missing
 * everywhere and are easy to forget per call site:
 *   1. ImageKit edge resizing when the asset lives there (see lib/images).
 *   2. A mandatory `sizes` value when using `fill`, without which the browser
 *      assumes 100vw and downloads a full-width image for a thumbnail.
 *   3. A graceful fallback when the URL is missing or 404s, rather than a
 *      broken-image glyph.
 */

type SmartImageProps = Omit<ImageProps, 'src' | 'loader' | 'onError'> & {
  src?: string | null;
  /** Shown if src is empty or fails to load. */
  fallbackSrc?: string;
};

export function SmartImage({
  src,
  alt,
  fallbackSrc = PLACEHOLDER_PRODUCT_IMAGE,
  sizes,
  fill,
  quality = 80,
  ...rest
}: SmartImageProps) {
  const initial = src && src.trim().length > 0 ? src : fallbackSrc;
  const [current, setCurrent] = useState(initial);

  // A `fill` image with no `sizes` makes the browser fetch for a 100vw slot.
  // Defaulting is better than silently shipping the oversized variant, but
  // call sites should pass something accurate.
  const resolvedSizes = fill ? (sizes ?? '(max-width: 768px) 50vw, 25vw') : sizes;

  return (
    <Image
      {...rest}
      key={current}
      src={current}
      alt={alt}
      fill={fill}
      sizes={resolvedSizes}
      quality={quality}
      loader={isImageKitUrl(current) ? imagekitLoader : undefined}
      onError={() => {
        if (current !== fallbackSrc) setCurrent(fallbackSrc);
      }}
    />
  );
}
