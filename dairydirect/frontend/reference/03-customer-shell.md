# 03 — Customer shell

```
CONTEXT
Phases 1 and 2 merged. The customer shell currently renders TopBar + Header (768 lines) +
CategoryNavBar + <main max-w-[1600px]> + Footer + CartContainer + NotificationDrawer +
BottomNav + SupportChat, all from src/app/(customer)/layout.tsx.

GOAL
A mobile-app-first shell that feels like Blinkit/Zepto on a phone and like a premium
marketplace on desktop. Split the mega-header. Keep every href, every route, every store
selector intact.

STEP 1 — SPLIT THE HEADER (do this first, in one commit, with zero visual change)
Break src/components/navigation/Header.tsx into:
  components/navigation/HeaderBar.tsx      — composes the pieces, <200 lines
  components/navigation/SearchBar.tsx      — input + rotating placeholder + mic/barcode icon
  components/navigation/LocationSheet.tsx  — address list + "use current location"
  components/navigation/CartButton.tsx     — item count badge + subtotal
  components/navigation/AccountMenu.tsx    — auth-aware dropdown (exists already, extend)
Move the existing logic verbatim. Do not change behaviour yet.
Verify all routes still render.

STEP 2 — HEADER LAYOUT (mobile-first, then scale up)
Base (≤639px): 2 rows, total height 104px, sticky top-0 z-40,
  bg-surface/95 backdrop-blur
    row 1 (28px): [pin icon + area name + chevron] ......... [bell] [avatar]
                  + right-aligned ETA chip:
                    bg-success-bg text-success text-[11px] font-700 px-2 h-6 rounded-full
                    "in 18 min"
    row 2 (44px): full-width search pill; placeholder rotates every 3s from
                  ROTATING_SEARCH_HINTS (keep the existing array and interval logic)
md+ (≥768px): single row 72px:
  logo | search (flex-1, max-w-xl) | wishlist | bell | cart | account.
  Above it, keep TopBar as a 32px saffron announcement strip with text-on-primary.

Scroll behaviour: after 64px of scroll, add `shadow-sm` and translate row 1 up by -8px
with opacity .9 — no full hide (search must stay reachable). Use a passive scroll listener
+ requestAnimationFrame, not Framer's useScroll on every frame.

STEP 3 — STICKY CART BAR (new, mobile only)
components/cart/StickyCartBar.tsx — appears when totalItems > 0.
  absolute bottom-[calc(var(--h-bottomnav)+8px)] left-3 right-3 z-40
  bg-primary text-on-primary rounded-[var(--radius-lg)] h-14 px-4 shadow-lg
  left: "3 items · ₹247" (tabular) · right: "View cart" + chevron
  enter: translate-y-[140%] -> 0, opacity 0 -> 1, 300ms var(--ease-spring)
  exit: reverse, 180ms
  role="status" aria-live="polite" so the count is announced.
  Sits UNDER the CartContainer drawer (z-50) and must not cover the last grid row —
  <main> gets pb-[calc(var(--h-bottomnav)+64px)] on mobile.

STEP 4 — BOTTOM NAV
Rebuild components/shared/BottomNav.tsx on tokens:
  h-[var(--h-bottomnav)], bg-surface border-t border-border,
  pb-[env(safe-area-inset-bottom)], 5 items
  (Home · Shop · Offers · Orders · Account — keep the existing hrefs and i18n labels).
  Active: text-brand-ink + a 34×26 rounded-full bg-primary-fixed behind the icon, and the
  icon scales 1.1 with translateY(-2px) using 320ms var(--ease-spring).
  Inactive: text-foreground-muted.
  Hide the label on the active item only if it breaks 320px width — test it.
  Badge on Orders = unread order updates; a single 8px dot, never a number, on Account.

STEP 5 — CONTENT
Wrap <main> in a container: mx-auto w-full max-w-[var(--w-content)] px-0 md:px-6.
Add the mobile bottom padding from STEP 3. Keep the existing max-width cap behaviour for
individual pages that narrow themselves further.

DO NOT
Touch: CartContainer, NotificationDrawer, SupportChat, AuthGuard (except their z-index if
they collide). Do not change any href, any useStore selector, or the search submit behaviour.

ACCEPTANCE
1. HeaderBar.tsx < 200 lines; no component in components/navigation exceeds 250 lines.
2. 390px width: header 104px, search always visible, cart bar slides in on first add,
   bottom nav respects the home-indicator safe area on iOS.
3. 1440px width: one clean 72px header row, announcement strip on top, no mega-menu sprawl.
4. Every existing route renders; `rg 'href="/' src/components/navigation` diff shows zero changes.
5. Lighthouse mobile: no layout shift on scroll (CLS 0).
```

---

## Shell anatomy — target state

```
┌───────────── MOBILE (390px) ─────────────┐   ┌──────────── DESKTOP (≥768) ────────────┐
│ ┌── saffron announcement strip 32px ───┐ │   │ ┌── saffron announcement strip 32px ─┐ │
│ ├─ ◉ Ahmedabad West ▾    in 18 min ────┤ │   │ ├ logo │ search ────────── │ ♡ 🔔 cart ┤ │
│ │  🔍 Search for "A2 Gir Cow Milk"     │ │   │ ├ Category rail ────────────────────┤ │
│ ├──────────────────────────────────────┤ │   │                                        │
│ │                                      │ │   │   content, max-w-[1600px]              │
│ │   content (scrolls)                  │ │   │                                        │
│ │                                      │ │   │                                        │
│ │  ┌── 3 items · ₹247 ── View cart → ─┐│ │   │                                        │
│ ├─ ⌂ Home ▦ Shop ◈ Offers ▤ Orders ◔ ─┤│ │   │                                        │
│ └── 64px + safe-area ──────────────────┘│   │                                        │
└──────────────────────────────────────────┘   └────────────────────────────────────────┘
```

### Why split `Header.tsx` first
It's 768 lines doing search + location + cart + notifications + address drawer + account
menu. Any later change to it is a merge conflict waiting to happen, and Antigravity will
struggle to hold it in context. Split it **with zero behaviour change** in its own commit,
verify all routes, *then* restyle. That sequencing is what makes the rest of the phase safe.

### Component size budget
| File | Max lines |
|---|---|
| `HeaderBar.tsx` | 200 |
| any file in `components/navigation/` | 250 |
| `StickyCartBar.tsx` | 120 |

CI-worthy rule: a PR that grows `Header.tsx` back past 250 lines should not merge.
