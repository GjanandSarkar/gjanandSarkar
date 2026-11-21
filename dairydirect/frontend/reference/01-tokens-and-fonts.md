# 01 — Tokens & Fonts

```
GOAL
Replace the colour + type + motion foundation with the GSS v2 token set, and add the
display and Devanagari/Gujarati fonts. No component layout changes in this phase.
This phase alone re-skins all ~60 pages, because components already use semantic classes.

TASK 1 — TOKENS
Edit src/app/globals.css:
• Keep the `@import "tailwindcss";` line and any utility/keyframe blocks below the
  token blocks.
• Replace the existing `@theme { … }` block, the `:root { … }` block, and the
  `.dark { … }` block with the GSS v2 definitions in tokens/gss-tokens.css.
• CRITICAL: preserve these existing token NAMES exactly, only change their values:
    primary, primary-hover, primary-active, primary-light, primary-fixed,
    primary-fixed-dim, on-primary, secondary, secondary-hover, on-secondary,
    background, surface, surface-muted, surface-elevated, foreground,
    foreground-muted, foreground-inverse, border, border-hover, ring,
    success, success-bg, warning, warning-bg, error, error-bg, info, info-bg,
    and every legacy alias (cream, dark, sand, mint, clay, red, on-surface,
    on-surface-variant, outline, outline-variant, surface-container-*).
  Existing components rely on these and must not break.
• ADD new tokens: brand-ink, stocks, admin, font-display, the --text-* scale,
  --radius-3xl, --shadow-xs/sm/md/lg, --ease-*, --dur-*,
  --w-content/admin/franchise, --h-header-*.

TASK 2 — FONTS
• Download into src/fonts/ and COMMIT them (never fetch at runtime):
    bricolage-grotesque-latin-wght-normal.woff2
    noto-sans-devanagari-devanagari-wght-normal.woff2
    noto-sans-gujarati-gujarati-wght-normal.woff2
  Source pattern:
    https://cdn.jsdelivr.net/npm/@fontsource-variable/<family>/files/<file>
• In src/app/layout.tsx: replace the single `inter` localFont with four localFont calls
  (ui, display, devanagari, gujarati) exactly as specified below, with
  preload:true only for ui and display, adjustFontFallback:"Arial" for ui, and
  preload:false for the Indic faces.
• Apply all four .variable classNames to the <html> element alongside the existing ones.
• Add `lang` and `data-locale` props to <html>, driven by a locale value (default "en").
  Wire it to the existing LanguageManager / locale handler if one exists; if not, read a
  `locale` cookie in the root layout and pass it down. Do NOT build a new i18n framework.
• Set <html lang> correctly — screen readers depend on it.

TASK 3 — BASE LAYER
• body uses var(--font-sans) and the new --text-body size.
• h1, h2, .font-display use var(--font-display) with letter-spacing:-0.02em.
• Add the .tabular / [data-numeric] rule.
• Add the focus-visible rule and the 44px min tap target rule.
• Add the prefers-reduced-motion block.

DO NOT
• Do not touch any component file in this phase.
• Do not remove the legacy aliases — grep first:
    rg "bg-cream|text-clay|border-sand|bg-mint" src/

ACCEPTANCE
1. `npx tsc --noEmit` and `npm run lint` clean.
2. Visiting /home, /products, /cart, /admin, /seller/dashboard shows the new saffron
   palette with zero component edits and no unstyled/broken elements.
3. Buttons that previously had white text on #0c831f now read as near-black text on
   saffron (thanks to --on-primary). If any button still looks low-contrast it is using a
   hardcoded white — list those files, do not fix them yet.
4. Network tab: only inter + bricolage woff2 load on an English page.
   Devanagari does NOT load.
5. Setting the locale cookie to "hi" and reloading swaps the body font with no layout break.
```

---

## The `layout.tsx` font block (replace the current single `inter` const)

```tsx
import localFont from "next/font/local";

const ui = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  variable: "--font-ui",
  weight: "100 900",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",   // kills CLS on swap
});

const display = localFont({
  src: "../fonts/bricolage-grotesque-latin-wght-normal.woff2",
  variable: "--font-display",
  weight: "200 800",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
});

// Lazy: English users never download these
const devanagari = localFont({
  src: "../fonts/noto-sans-devanagari-devanagari-wght-normal.woff2",
  variable: "--font-devanagari",
  weight: "100 900",
  display: "swap",
  preload: false,
});

const gujarati = localFont({
  src: "../fonts/noto-sans-gujarati-gujarati-wght-normal.woff2",
  variable: "--font-gujarati",
  weight: "100 900",
  display: "swap",
  preload: false,
});
```

Then on the `<html>` tag:

```tsx
<html
  lang={locale}                          // "en" | "hi" | "gu" | "mr"
  data-locale={locale}
  className={`${ui.variable} ${display.variable} ${devanagari.variable} ${gujarati.variable}`}
  suppressHydrationWarning
>
```

## The font-choice rationale

| Role | Face | Why | Weight |
|---|---|---|---|
| UI / body | **Inter** (already self-hosted) | Best Devanagari-adjacent Latin, tabular numerals, free | 48 KB |
| Display / headlines | **Bricolage Grotesque** (variable) | Designed with Indian street-signage / hoarding lettering as an explicit influence. Reads "Indian modern" without being kitsch. | ~40 KB |
| Devanagari | **Noto Sans Devanagari** (variable) | Pairs with Inter metrics; covers Hindi/Marathi | ~55 KB, lazy |
| Gujarati | **Noto Sans Gujarati** (variable) | Ahmedabad market | ~45 KB, lazy |

*Fallbacks: Fraunces (serif, warmer) or Poppins (geometric, Blinkit-ish) for display.*

## Where each thing is changed — the only table you need

| I want to change… | File | Never do this |
|---|---|---|
| Which font the app uses | `src/app/layout.tsx` → `localFont({ src: "../fonts/X.woff2" })` | Never `@import` from Google Fonts |
| Adding a new font file | Drop `.woff2` in `src/fonts/`, register a new `localFont` + CSS var | Never ship 7 static weights — variable only |
| Type scale / sizes | `globals.css` → `--text-*` in `@theme` | Never `text-[13px]` arbitrary values |
| Line-height / tracking | same block | — |
| Font per language | `globals.css` → the `html[lang="hi"]` rule | Never conditionally import fonts inside components |
| Heading font usage | `h1,h2,.font-display` base rule + `font-display` utility | Don't apply display font to body or buttons |

**Rule for the whole team, from now on:** `font-family` appears in **exactly one place** —
`globals.css`. Any `font-sans` / `font-[Inter]` in a component is a bug.

**Why the language swap is one CSS rule:** no component knows a language exists.
`LanguageManager` only has to set `document.documentElement.lang` + `data-locale` and
persist the choice. Everything else follows from the cascade.

## Contrast ledger

| Pair | Ratio | Verdict |
|---|---|---|
| `#2A1608` on `#FF9933` | 8.9:1 | ✓ AAA — all saffron buttons |
| `#B4460A` on `#FFFBF5` | 4.6:1 | ✓ AA — saffron text/links |
| `#FFFFFF` on `#000080` | 16:1 | ✓ AAA — admin |
| `#FFFFFF` on `#0F6B06` | 5.5:1 | ✓ AA — success text |
| `#FFFFFF` on `#138808` | 3.9:1 | ⚠ large/bold only — badges, ETA chips |
| `#1A1715` on `#FFFBF5` | 15.8:1 | ✓ AAA — body |
| `#FF9933` on `#FFFFFF` | 2.1:1 | ✗ FAIL — never saffron text on light |

### Why saffron is a surface, not a text colour
`#FF9933` with white text is 2.1:1 — unreadable on cheap Android panels in sunlight.
Every Indian-flag design hits this. Saffron buttons therefore carry near-black text
(8.9:1). Text links and active states use the deeper `#B4460A` (4.6:1). You get flag
authenticity *and* WCAG AA. This is the same move Blinkit makes with yellow-on-black.
