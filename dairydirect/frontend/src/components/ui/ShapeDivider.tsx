/**
 * Decorative section dividers.
 *
 * Inline SVG rather than a background image: these sit between full-bleed
 * colour blocks, so they must take the exact token colour of the section
 * below them and change with the theme. A PNG or an external asset could do
 * neither, and would cost a request on a page that is already image-heavy.
 *
 * Purely decorative, so every instance is aria-hidden and removed from the
 * accessibility tree.
 */

type DividerVariant = 'wave' | 'tilt' | 'curve';

interface ShapeDividerProps {
  /** Shape to draw. */
  variant?: DividerVariant;
  /**
   * Fill colour, as a CSS value. Should be the background of the section the
   * divider is flowing *into*, which is what makes the seam disappear.
   */
  color?: string;
  /** Flip vertically, for dividers at the top of a section. */
  flip?: boolean;
  /** Height in pixels. Kept small on mobile so it never eats the fold. */
  height?: number;
  className?: string;
}

const PATHS: Record<DividerVariant, string> = {
  // Gentle asymmetric wave — reads as organic without looking like a template.
  wave: 'M0,64 C240,112 480,16 720,40 C960,64 1200,112 1440,72 L1440,120 L0,120 Z',
  // Single diagonal. Cheapest visually; good between two dense sections.
  tilt: 'M0,120 L1440,24 L1440,120 Z',
  // Convex curve, for lifting a light section over a coloured one.
  curve: 'M0,120 C360,24 1080,24 1440,120 L1440,120 L0,120 Z',
};

export function ShapeDivider({
  variant = 'wave',
  color = 'var(--background)',
  flip = false,
  height = 48,
  className = '',
}: ShapeDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative w-full overflow-hidden leading-none pointer-events-none ${className}`}
      style={{ height }}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ transform: flip ? 'rotate(180deg)' : undefined }}
      >
        <path d={PATHS[variant]} fill={color} />
      </svg>
    </div>
  );
}
