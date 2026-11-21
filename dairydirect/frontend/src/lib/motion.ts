/**
 * GSS MOTION TOKENS & VARIANTS
 *
 * Source of truth: reference/01-tokens-and-fonts.md & reference/06-motion-and-states.md.
 * 
 * Only these curves/durations exist in the entire product:
 *   durations: press (120ms), state (180ms), nav (280ms), hero (400ms)
 *   curves: standard, enter, exit, expo, spring
 *
 * Changing these constants mirrors changing the CSS variables in globals.css.
 */

export const D = {
  press: 0.12,
  state: 0.18,
  nav: 0.28,
  hero: 0.40,
} as const;

export const E = {
  standard: [0.4, 0, 0.2, 1] as const,
  enter: [0, 0, 0.2, 1] as const,
  exit: [0.8, 0, 1, 1] as const,
  expo: [0.25, 1, 0.5, 1] as const,
  spring: [0.22, 1, 0.36, 1.4] as const, // The single allowed overshoot curve
} as const;

/**
 * Reusable Framer Motion variants.
 * Rules:
 * - No ad-hoc inline transition durations.
 * - Under prefers-reduced-motion, Framer respects the global reduced motion setting.
 */

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: D.state, ease: E.standard } },
  exit: { opacity: 0, transition: { duration: D.press, ease: E.exit } },
};

export const fadeUpSmall = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: D.state, ease: E.enter } },
  exit: { opacity: 0, y: -4, transition: { duration: D.press, ease: E.exit } },
};

export const fadeUpLarge = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: D.hero, ease: E.expo } },
  exit: { opacity: 0, y: -10, transition: { duration: D.state, ease: E.exit } },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: D.state, ease: E.enter } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: D.press, ease: E.exit } },
};

export const sheetSpring = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { duration: 0.32, ease: E.spring } },
  exit: { y: '100%', transition: { duration: 0.22, ease: E.exit } },
};

export const staggerList = {
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const listItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: D.state, ease: E.standard } },
};

export const cartBump = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.18, 1],
    transition: { duration: 0.28, ease: E.spring },
  },
};

export const tabPop = {
  initial: { y: 0, scale: 1 },
  animate: {
    y: -2,
    scale: 1.1,
    transition: { duration: D.nav, ease: E.spring },
  },
};

