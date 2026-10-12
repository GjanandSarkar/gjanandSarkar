import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge has to guess which group a `text-*` class belongs to, and it
 * gets our design system wrong in both directions:
 *
 *   1. Our fluid typography scale (`text-body-lg`, `text-h1`, ...) is defined
 *      as plain CSS in globals.css, so tailwind-merge does not know those are
 *      font sizes.
 *   2. Our theme colour names (`text-foreground-inverse`, `text-primary`, ...)
 *      are not in its default colour list, so it files them under font-size.
 *
 * Both land in the same bucket, so a later size class silently DELETES the
 * colour class. That is not hypothetical: every Button carried
 * `text-foreground-inverse` from its variant followed by `text-body-lg` from
 * its size, so the colour was dropped from literally every button in the app.
 * They only looked correct where the inherited colour happened to be legible
 * -- which is why "Pay with Razorpay" rendered dark text on a dark green
 * button.
 *
 * Declaring both groups explicitly keeps colour and size independent.
 */
const FONT_SIZES = [
  "display", "h1", "h2", "h3",
  "body-lg", "body-md", "body-sm",
  "caption",
] as const

const THEME_COLORS = [
  "background", "border", "border-hover", "clay", "cream", "dark",
  "error", "error-bg", "foreground", "foreground-inverse", "foreground-muted",
  "info", "info-bg", "mint", "muted", "on-primary", "on-secondary",
  "on-surface", "on-surface-variant", "outline", "outline-variant",
  "primary", "primary-active", "primary-fixed", "primary-fixed-dim",
  "primary-hover", "primary-light", "red", "ring", "sand", "secondary",
  "secondary-hover", "success", "success-bg", "surface", "surface-container",
  "surface-container-low", "surface-container-lowest", "surface-elevated",
  "surface-muted", "warning", "warning-bg",
] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZES] }],
      "text-color": [{ text: [...THEME_COLORS] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000';
    
  // Prefer window.location.origin for reliable OAuth redirects on any environment
  if (typeof window !== 'undefined') {
    url = window.location.origin;
  }
  
  // Ensure https when not localhost
  url = url.includes('http') ? url : `https://${url}`;
  
  // Clean trailing slashes
  url = url.replace(/\/+$/, '');
  return url;
};
