# 05 — Design System v2: "Bright q-commerce"

**Status:** chosen direction. Supersedes the earlier "Quiet Heritage" proposal.
**Implemented in:** `src/app/globals.css` (`:root` tokens), `src/components/*`, `src/app/(customer)/subscribe/*`.
**Launch scope:** dairy only (`DAIRY_ONLY`).

---

## 1. The direction

A white canvas, one saturated green, product cards that do the talking, and prices you can read from arm's length.

Indian quick-commerce has already trained 200 million shoppers in a grammar: dense cards, a big bold price, a single ADD button, sticky search, a bottom bar that never moves. Blinkit, Zepto and Instamart are fast because the interface is *predictable*, not because it is minimal. Our job is not to invent a new grammar for a dairy brand — it is to execute that grammar with better craft and a calmer accent, so the result feels premium rather than loud.

**Design thesis:** *Fast enough to feel effortless, warm enough to feel fresh.*

Three sources, one system:

| Borrowed from | What we take | What we leave |
|---|---|---|
| Blinkit | Dense grid, bold price, ADD/stepper, category rail | Yellow as a full-canvas colour |
| Zepto | Sticky search, cart bar with savings, honest delivery promise | Gamified spin/timer surfaces |
| Instamart | Morning-delivery slot framing, subscription upsell placement | Multi-category visual noise |
| Specialty dairy brands | Product photography, provenance, farm language | Slow editorial layouts, serif type at UI sizes |

**Why not keep the heritage palette?** Deep forest on cream was differentiated, but at launch it read as *careful* rather than *confident*: 10–12 px labels, five competing trust badges, a 176 px header before any product appeared, and ochre used for both prices and warnings. A shopper comparing us to Blinkit in the same minute needs the product — not the brand story — to win the first screen. Bright q-commerce keeps the brand's quality cues but moves them out of the way of the price.

> **Non-negotiable:** the accent is green because freshness is the product. Amber is used only for price/saving/scarcity. Everything else is white, ink and hairline grey. If a screen needs a third accent to work, the hierarchy is wrong.

---

## 2. Colour

All values are implemented as CSS custom properties in `globals.css` and consumed through semantic Tailwind classes (`bg-primary`, `text-foreground-muted`, `border-border`). No component should use a raw hex value.

### Core

| Token | Value | Used for | Contrast |
|---|---|---|---|
| `--primary` | `#0A7B3E` | Primary buttons, active nav, links, selected state | 5.36:1 on white |
| `--primary-hover` | `#086A35` | Hover | 6.2:1 |
| `--primary-active` | `#065C2D` | Pressed | 7.1:1 |
| `--primary-fixed` | `#E7F7EE` | Selected chips, info panels, plan badges | 5.0:1 with primary text |
| `--primary-fixed-dim` | `#C8EDD8` | Progress tracks, hover on mint | — |
| `--secondary` | `#B45309` | Price drops, "Most popular", scarcity | 5.02:1 on white |
| `--secondary-bg` | `#FFF6E5` | Amber surface | 4.9:1 with secondary text |
| `--background` | `#FFFFFF` | Page canvas | — |
| `--surface` | `#FFFFFF` | Cards, sheets | — |
| `--surface-muted` | `#F4F6F5` | Image wells, skeletons, secondary fills | — |
| `--foreground` | `#101613` | Primary text | 18.3:1 |
| `--foreground-muted` | `#5B6660` | Secondary text, meta | 5.98:1 |
| `--border` | `#E6EAE7` | Hairlines at rest | — |
| `--border-hover` | `#CBD5CF` | Hover border | — |
| `--error` | `#DC2626` | Destructive, failures | 4.8:1 |

### Rules

1. **One accent per viewport.** Green owns actions. If a screen has two green CTAs, one is not a CTA.
2. **Green is never body text below 14 px.** At small sizes it vibrates against white.
3. **Amber never carries information alone.** Pair it with a word ("Save ₹26"), because ≈8 % of Indian men have a red-green deficiency and amber/red is the first confusion.
4. **No colour-only states.** Selected = border + tint + check icon. Error = icon + text + tint.
5. **Shadows are almost invisible.** `0 1px 2px rgba(16,22,19,.05)` at rest; a real shadow only on floating surfaces (cart bar, sheet, sticky summary).
6. **Dark mode** keeps the same semantics (`#3DDC84` primary on `#0B0F0C`), but is not the default: quick-commerce is a daytime, bright-light use case in India.

### Contrast gate (CI)

Minimum AA: 4.5:1 body, 3:1 large text and UI boundaries. Every pairing in the table above passes. The two values that previously failed — 10 px `text-muted` on cream (3.9:1) and ochre body text (4.1:1) — are gone by construction: `muted` is now 5.98:1 and ochre is restricted to labels ≥ 12 px bold.

---

## 3. Typography

Inter, self-hosted variable (one 48 KB woff2, preloaded). No display serif at UI sizes: at 10–14 px it costs legibility and gains nothing.

| Role | Size / line-height | Weight | Where |
|---|---|---|---|
| Price XL | 22 / 26 | 800 | Plan summary, cart total |
| Price | 18 / 22 | 800 | Product card |
| Title L | 24–30 / 1.2 | 800 | Page H1 |
| Title M | 16 / 22 | 700 | Section heading, card title |
| Body | 14 / 20 | 400–500 | Default |
| Meta | 12 / 16 | 500 | Weight, brand, slot |
| Label | 11 / 14 | 700, `tracking-wider`, uppercase | Badges, stat labels |
| Micro | 10 / 12 | 700 | Bottom-nav labels, "per delivery" |

**Rules**

- Minimum **12 px** for anything a customer must read; 10 px is allowed only for repeated chrome (nav labels).
- Prices use `tabular-nums` and Indian digit grouping (`₹1,24,000`, not `₹124,000`).
- No font weight below 400, no letter-spacing below `-0.02em` on headings.
- Numerals in steppers and totals never shift width (`tabular-nums`).

---

## 4. Geometry, spacing and motion

- **Spacing:** 4 pt base — 4, 8, 12, 16, 20, 24, 32, 40, 48. Page gutter 16 px mobile, 24 px tablet, 32 px desktop.
- **Radius:** inputs/buttons `12`, cards `16`, sheets `24`, pills `999`. One radius per element class; no arbitrary values.
- **Touch targets:** 44 × 44 minimum, 48 for primary mobile actions. The ADD button is 36 × 36 visually but has a 44 px hit area via padding.
- **Density:** product grid `2 / 3 / 4 / 5 / 6` columns at `base / sm / lg / xl / 2xl`. Card aspect ratio 1:1 image, fixed 2-line title, price row pinned to the bottom so rows align.
- **Motion:** 120–180 ms, `ease-out`. Only opacity, transform and colour. Never animate layout. Respect `prefers-reduced-motion`.
- **Elevation:** flat by default. Floating only: bottom nav (blur + border-top), cart bar, dialogs, toasts.

---

## 5. Layout shells

### Customer (mobile-first)

```
┌─────────────────────────────────────┐
│ Announcement strip (28px, optional) │
│ Location + search + cart  (sticky)  │  ← collapses to 56px on scroll
│ Category chips (horizontal scroll)  │
├─────────────────────────────────────┤
│ Content — max 1600px, gutters 16    │
├─────────────────────────────────────┤
│ Cart bar (if items)                 │  ← above bottom nav
│ Bottom nav 64px + safe-area         │
└─────────────────────────────────────┘
```

- Header budget: **≤ 132 px** before content on a 390 px viewport. The previous 176 px pushed every product below the fold.
- Bottom nav: Home · Shop · Plan (subscriptions) · Orders · You. The Plan tab is the launch differentiator, not a footer link.
- Search is sticky and full-width; voice input sits inside the field, not in a separate button row.

### Admin / seller (desktop-first, still usable at 360 px)

- Sidebar 240 px, collapses to a sheet under `lg`.
- Tables become stacked cards under `md` (label/value pairs), never a horizontally scrolling table.
- Primary admin action always remains visible on mobile (sticky bottom bar), because approving a seller from a phone is a real use case.
- Density on desktop: 40 px rows, 13 px table text, one accent button per toolbar.

---

## 6. Components

### 6.1 Product card (the most important component)

```
┌──────────────────┐
│  image 1:1       │  radius 12, surface-muted well
│  [Save ₹26]      │  amber pill, only when true
├──────────────────┤
│ Delivery in 8 h  │  11/700 green, one line
│ A2 Cow Milk      │  14/700, 2 lines max
│ 1 L · Gir Organic│  12/500 muted
│ ₹84  ₹105  [ADD] │  price 18/800 · MRP 12 strike · 36px ADD
└──────────────────┘
```

- Hairline border only; no shadow at rest. Hover: border darkens + 2 % lift on desktop.
- ADD → stepper in place (no modal, no navigation), optimistic, with a 200 ms tick.
- Out of stock: image at 40 % opacity, "Notify me" replaces ADD. Never show a disabled ADD with no explanation.
- One badge maximum per card: discount **or** "Bestseller" **or** "New". Stacked badges are noise.
- Subscription-eligible dairy shows a small "Plan & save" link under the price — a text link, not a second button.

### 6.2 Price block

`₹84` (18/800) · `₹105` (12/500, line-through, muted) · `Save ₹21` (11/700, amber). Never compute a percentage the customer has to decode; never show a strike-through without a real reference price.

### 6.3 Plan card (subscriptions)

Implemented in `src/components/subscribe/SubscriptionHub.tsx`.

- 14 px product image well, title + status pill on one line.
- Line 2: `2 × 1 L · Every day`; line 3: `Next Wednesday · 6:00 – 8:00 AM`.
- Price row: `₹168 / delivery` left, `≈ ₹5,040/mo` right in muted 11 px.
- Actions in a hairline-separated footer: **Skip next**, **Pause/Resume**, **Cancel**. Cancel expands an inline confirm panel (no modal), with "Keep plan" as the visually equal escape.
- Busy state: the tapped action shows a spinner; other actions disable. Never a full-card skeleton for a single mutation.
- Paused cards use amber status and hide "Skip next" (nothing to skip).

### 6.4 Plan builder (4 steps)

`/subscribe/new` → `src/components/subscribe/PlanBuilder.tsx`.

1. **Choose milk** — 2-up cards, radio semantics, pack-size chips appear only when a product has > 1 variant.
2. **Quantity & days** — stepper (1–10) with live per-delivery price; cadence cards with a monthly estimate; "Most popular" badge on daily.
3. **Delivery** — start date (`min` = tomorrow, or day-after after the 9 PM cutoff), three windows, saved addresses.
4. **Review** — label/value rows, per-delivery total, the no-lock-in promise, one primary action.

Persistent right rail on desktop (sticky, 340 px); sticky bottom bar on mobile showing price + Continue. Progress is a 4-segment bar with `aria-current="step"`, not a decorative circle. Success is a dedicated screen with the first delivery date and "Manage my plan" — never a toast that disappears.

### 6.5 Buttons

| Variant | Use |
|---|---|
| Primary (green, 48 px mobile) | One per view: Add plan, Pay, Confirm |
| Secondary (white + border) | Alternate path: Keep plan, Change address |
| Ghost | Tertiary row actions: Skip, Pause |
| Destructive (red text, red-tint bg on confirm) | Cancel, delete, logout |

States: default / hover / pressed (`scale .98`) / loading (spinner + label, width locked) / disabled (40 % opacity, no pointer) / focus (2 px green ring, 2 px offset). Labels are verbs; no "OK".

### 6.6 Chips, badges, steppers

- Chips: 32 px height, 1 px border, selected = green tint + green border + 700 text. Horizontally scrollable with edge fade; never wrap to three rows.
- Badges: 10–11 px uppercase, 700, tracking wide, 4 px radius. Max one per card.
- Stepper: − / count / +, 40 px buttons, count in `tabular-nums`; the whole control is one accessible group with `aria-live` on the count.

### 6.7 Feedback

- Toast: bottom above nav, 4 s, one line, optional action. Success = green check; error = red icon + what happened + what to do. No blame ("We couldn't update your plan. Try again.").
- Inline errors sit next to the field and move focus there; never `alert()` (22 instances removed in the P0 pass).
- Empty states: icon, one sentence of what this is, one primary action. Subscriptions empty state sells the ritual ("Delivered before breakfast") plus the three guarantees.
- Skeletons mirror final layout exactly (same heights) to prevent CLS; no spinners for content that has a known shape.

---

## 7. Accessibility

- WCAG 2.2 AA target. All interactive elements reachable by keyboard; visible focus ring is part of the component, not a global override.
- Semantic HTML first: `fieldset/legend` for method and cadence groups, `ol` for progress and delivery timelines, `aria-pressed` for selection chips, `aria-live="polite"` for async confirmations.
- Screen-reader-only headings are added where a visual section has no heading (e.g. the summary rail).
- Motion respects `prefers-reduced-motion`; no autoplaying carousel (the hero advances only on user input).
- Colour independence: status is always icon + text.
- Language: all strings go through `src/lib/i18n`, with English + Hindi at launch; numerals stay Latin for prices.

---

## 8. Ethical persuasion (the line)

Quick-commerce's dark patterns are well documented: drip fees, basket sneaking, countdown timers that reset, confirm-shaming, subscription traps. CCPA's 2023 guidelines prohibit them and, from 1 January 2027, platforms must publish an annual self-audit. We design against the list instead of optimising into it.

**Use:** true scarcity ("Only 4 left in today's batch" backed by real stock), free-delivery progress that starts at 20 %, a quality report before the ask, saved-UPI intent, one-tap repeat order, pause/skip one tap deep.

**Never:** platform/handling fees revealed at payment, auto-added "free" items, a permanent "Only 2 left", fake countdowns, a cancel flow behind three screens, pre-ticked marketing consent, or a price that changes by device.

> The subscription promise is the product: *pause, skip or cancel in two taps, pay per delivery.* Every one of those must be literally true in the UI, not just in the marketing.

---

## 9. Implementation map

| Concern | File |
|---|---|
| Tokens, radius, dark mode | `src/app/globals.css` (`:root`, `.dark`) |
| Buttons | `src/components/ui/Button.tsx` |
| Product card | `src/components/product/ProductCard.tsx` |
| Header / nav / cart bar | `src/components/navigation/*`, `src/components/cart/*` |
| Subscription hub | `src/app/(customer)/subscribe/page.tsx` + `components/subscribe/SubscriptionHub.tsx` |
| Plan builder | `src/app/(customer)/subscribe/new/page.tsx` + `components/subscribe/PlanBuilder.tsx` |
| Cadence maths | `src/lib/subscriptions/schedule.ts` |
| Subscription API | `src/app/api/subscriptions/route.ts` |

**Migration rule:** replace hex values and arbitrary sizes with semantic tokens as files are touched; do not run a blind find-and-replace. The token names are stable, so the palette can be re-tuned in one file without touching components.

---

## 10. Before / after

| Surface | Before | After |
|---|---|---|
| Canvas | Cream `#FBF8F2` | White `#FFFFFF` |
| Accent | Forest `#0C3C26` + ochre | Green `#0A7B3E` + amber `#B45309` |
| Header height | ~176 px | ≤ 132 px, sticky search |
| Type scale | 311 arbitrary sizes, 10 px labels | 8-step scale, 12 px floor |
| Card | border + shadow + tint | hairline, elevation only when floating |
| Product grid | 2 / 3 / 4 | 2 / 3 / 4 / 5 / 6 |
| Price | 14 px semibold | 18 px extrabold, tabular |
| Trust | 5 badges, no promise | 1 promise + 1 proof per screen |
| Subscription | two redirects to `/home` | hub + 4-step builder + pause/skip/cancel |

---

## 11. App-readiness (web now, React Native later)

The system is already structured for a native port:

- **Tokens are values, not CSS tricks.** The same JSON can feed a React Native theme.
- **Components have explicit states** (default/hover/pressed/loading/disabled), so gesture equivalents are obvious.
- **Bottom navigation and sticky action bars** match native patterns instead of fighting them.
- **Safe areas** are respected via `env(safe-area-inset-bottom)` and the `--bottom-nav-h` variable.
- **No hover-only functionality**; every hover affordance has a tap equivalent.
- **Data contracts are separate from views** (`lib/subscriptions/*`, `lib/api/client.ts`), so a native client can reuse the same `/api` endpoints with the JWT cookie or bearer token.
