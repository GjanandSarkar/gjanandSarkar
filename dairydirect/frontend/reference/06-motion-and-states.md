# 06 — Motion & states

```
CONTEXT
Phases 1–5 merged. Three shells exist, primitives are on tokens, admin has a DataTable.
Nothing moves yet, and error/offline states don't exist.

GOAL
Make the product feel alive without spending a byte on animation libraries, and make every
possible state of every screen intentional: loading, empty, error, offline, slow.

RULE 0 — the only four ways to animate
  A) CSS transition on a token duration  (preferred — 90% of cases)
  B) Framer Motion with a variant imported from src/lib/motion.ts  (layout/shared element,
     enter-exit that needs orchestration)
  C) CSS @keyframes declared in globals.css, used via a utility class  (skeletons, pulses,
     progress)
  D) requestAnimationFrame for scroll-linked effects  (header shadow, parallax)
  Anything else is a bug. No inline transition strings, no magic numbers.
  Never animate anything under prefers-reduced-motion (the globals.css block already kills
  A/B/C for you — verify it does).

STEP 1 — src/lib/motion.ts
  Export variants only, no components:
    fadeIn, fadeUpSmall (-8px), fadeUpLarge (-20px), scaleIn (0.96 -> 1),
    sheetSpring (y 100% -> 0, var(--ease-spring), 320ms),
    staggerList (staggerChildren .04, delayChildren .05),
    listItem (fadeUpSmall),
    cartBump (scale 1 -> 1.18 -> 1, .28s),
    tabPop (y -2, scale 1.1).
  Every variant must read its duration/easing from the CSS variables at module scope:
    const D = { press:0.12, state:0.18, nav:0.28, hero:0.40 }
  so changing the token changes the JS too. Add a comment block explaining that.

STEP 2 — THE FIVE SIGNATURE INTERACTIONS (build exactly these, no more)
  1. ADD → STEPPER on product cards.
     Tap ADD: button morphs from a 32×72 pill into a 32×96 "− 1 +" stepper with a spring,
     the card lifts 2px, and the count ticks with a scale bump.
  2. FLY TO CART.
     On add, clone the product's emoji/image at 32px, animate it along a curved path
     (two-segment transform) to the cart icon over 420ms, then bump the cart badge.
     Implement with Framer's `animate()` on a portal div — no library.
     Skip entirely if the user has reduced motion.
  3. SHEET.
     Bottom sheets slide up with var(--ease-spring); the backdrop fades in 180ms;
     the content carries a drag-to-dismiss handle (Radix + a small drag threshold).
  4. TAB / RAIL ACTIVE INDICATOR.
     Bottom-nav icon scales to 1.1 and lifts 2px while a 34×26 pill fades in behind it;
     the admin rail's active 3px bar slides between items with a shared layoutId.
  5. SKELETON → CONTENT CROSSFADE.
     Never a flash: when data arrives, the skeleton fades out over 120ms while the content
     fades up 8px over 200ms. Apply to every list/grid via a wrapper.

STEP 3 — STATES, EVERYWHERE
  For every data-driven surface in the three apps, implement all four:
    loading  -> a skeleton shaped like the real content (not a spinner)
    empty    -> EmptyState with an action ("Browse products", "No orders today — nothing to do")
    error    -> EmptyState with the error message + Retry; never a raw stack trace
    offline  -> a persistent 32px bar above the bottom nav:
                bg-warning-bg text-warning text-[12px], "You're offline — showing saved data"
                driven by navigator.onLine + the online/offline events, and it must not
                stack on re-render.
  Coordinate loading: if a request takes >400ms show the skeleton, below that show nothing
  (no flash). Put that in one hook:
    src/lib/hooks/useDelayedFlag.ts → useDelayedLoading(isLoading, 400)
  Add an app-level boundary:
    src/app/error.tsx (client) — friendly retry page
    src/app/not-found.tsx — branded 404 with links to /home and /products
    src/app/global-error.tsx
  Add per-route loading.tsx skeletons for /home, /products, /orders, /admin, /seller/dashboard
  so Next streams a skeleton instantly.

STEP 4 — FEEDBACK MICRO-DETAILS
  • Cart badge bump on every add (cartBump).
  • Copy-to-clipboard → swapped icon for 1.5s + a tiny "Copied" pill.
  • Form submit → the Button's loading prop (already built in phase 2).
  • Toast: one component, bottom-center above the cart bar, aria-live="polite", 3s auto-dismiss,
    swipe to dismiss.
  • Pull-to-refresh is NOT in scope unless the codebase already has it — check, don't add.

ACCEPTANCE
1. rg "transition-all|duration-300|ease-in-out" src/ → each remaining match is either gone or
   justified in a one-line comment (some layout transitions are legitimately `transition-all`,
   report them).
2. Toggling OS reduce-motion makes all of the 5 interactions instantaneous and removes the
   fly-to-cart entirely.
3. Throttle to Slow 3G + kill the network: every page shows a skeleton, then either content
   or an error with Retry; the offline bar appears and disappears correctly.
4. No layout shift when a skeleton is replaced (same heights).
5. Frame budget: scrolling /home and /products on a 4× CPU throttle stays under 16ms per
   frame — no long tasks over 50ms in the performance panel.
```

---

## Motion budget

| Token | Value | Used for |
|---|---|---|
| `--dur-press` | 120ms | button/idle press feedback |
| `--dur-state` | 180ms | hovers, fades, colour changes |
| `--dur-nav` | 280ms | tabs, rail indicator, drawers |
| `--dur-hero` | 400ms | sheets, hero entrances, fly-to-cart |

| Easing | Curve | Use |
|---|---|---|
| `--ease-standard` | cubic-bezier(.2,0,0,1) | most transitions |
| `--ease-enter` | cubic-bezier(0,0,.2,1) | things appearing |
| `--ease-exit` | cubic-bezier(.4,0,1,1) | things leaving (faster) |
| `--ease-expo` | cubic-bezier(.16,1,.3,1) | big hero moves |
| `--ease-spring` | cubic-bezier(.34,1.56,.64,1) | playful overshoot — the *only* overshoot |

### Why so few
Every q-commerce app's motion vocabulary is small: a press, a state change, a navigation
move, an entrance. Blinkit's entire inventory of signature animations fits in a list of
~10 (tab springs, festive header morph, map expand). Restraint is what makes those read as
delightful instead of busy. Five interactions, four durations, five curves — an agent can
hold that in context and apply it consistently, which is the actual goal here.

### Why no animation library
Framer Motion is already a dependency (check `package.json`; it is present in most of these
stacks). Everything above is CSS transitions plus Framer variants for two layout animations.
Adding Lottie/GSAP/react-spring would add 40–80 KB gzipped to a mobile-first app used on
3G, for effects that a 280ms cubic-bezier already sells.
