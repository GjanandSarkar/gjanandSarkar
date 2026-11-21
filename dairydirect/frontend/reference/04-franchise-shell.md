# 04 — Franchise shell

```
CONTEXT
Phase 0's repo map showed the franchise/store-manager screens living at
src/app/(customer)/seller/{dashboard,orders,store,activity}/page.tsx — inside the customer
route group, so they inherit the customer header, cart, and bottom nav. That is the bug.

GOAL
A dedicated, calm, task-focused console for a store manager on a mid-range Android phone.
Navy accent (var(--secondary)) — visually distinct from the saffron customer app so nobody
confuses the two.

STEP 1 — ROUTE GROUP (no URL change)
  git mv "src/app/(customer)/seller" "src/app/(franchise)/seller"
  Create src/app/(franchise)/layout.tsx.
  Confirm /seller/dashboard, /seller/orders, /seller/store, /seller/activity still resolve
  to the same URLs, and that they no longer render the customer header/footer/bottom nav.
  Keep the auth guard: the seller pages must still redirect non-sellers
  (reuse the existing guard the admin layout uses — read it first, don't invent one).

STEP 2 — NAVIGATION CONFIG
  src/app/(franchise)/_nav.ts  exporting FRANCHISE_NAV: {href,label,icon,badge?}[]
    /seller/dashboard  Overview
    /seller/orders     Orders        (badge = count of orders needing action)
    /seller/store      Products & stock
    /seller/activity   Activity log
  Plus a footer group: {href:"/seller/settings",label:"Store settings"} if that route exists —
  check first; if it doesn't, omit rather than create a dead link.

STEP 3 — THE RAIL
  Desktop ≥1024px: fixed left rail 240px,
    bg-surface border-r border-border, h-dvh, sticky.
    Top: 32px navy square monogram + truncating store name + "Store #<id>" in text-micro.
    Nav items: h-11 px-3 rounded-[var(--radius-md)], icon 20px + label text-[14px].
      Active: bg-secondary text-on-secondary (solid navy) — the ONLY place navy appears as a
      full fill in this shell besides primary actions.
      Hover: bg-surface-muted.
    Bottom card: "Store health" — a compact 3-line strip showing online/offline status dot,
    pending orders, and today's revenue with tabular numerals.
  Mobile <1024px: the same nav in a Slide-over Sheet opened from a 56px top bar
    (hamburger | store name | bell). No bottom tab bar — the manager is on a task, not
    browsing.

STEP 4 — CONTENT
  Main column: mx-auto max-w-[var(--w-franchise)] p-4 md:p-6, offset by the rail on lg+.
  Add src/components/franchise/PageShell.tsx:
    props { title, subtitle?, actions?, children }
    renders h1 text-headline (display font), subtitle text-body-sm text-foreground-muted,
    actions right-aligned (wrap on mobile), then children.

STEP 5 — RESTYLE THE FOUR PAGES
  For each of the four page files + the Seller* components they import
  (src/components/seller/**):
    • Replace raw colour classes with the tokens from gss-tokens.css.
    • Primary action per page = one navy `Button variant="navy"`.
    • Orders list -> card rows on mobile, table on md+, each row with a status Badge.
    • Any number that is currency or count gets class `tabular`.
    • Every list gets loading (Skeleton) / empty (EmptyState) / error branches.
  Do NOT change any data fetching call, prop shape, or the SellerDashboardData contract.

DO NOT
Change any API call, any supabase query, or the shape of SellerDashboardData. Do not add
new routes. Do not touch src/app/(customer)/.

ACCEPTANCE
1. `git mv` only — `git log --follow` shows history preserved, and `git diff --stat` shows
   the four page files moved with no content loss beyond styling.
2. /seller/dashboard at 390px renders no customer header, no cart, no bottom nav.
3. A non-seller account hitting /seller/dashboard is still redirected.
4. Zero USD-shell components imported inside (franchise) — check the import graph.
5. All four pages pass tsc + lint; nav config has no dead links.
```

---

## Splitting the three shells — visual comparison

```
CUSTOMER                        FRANCHISE                       ADMIN
saffron #FF9933 accent          navy  #000080 accent            navy  #000080 accent
mobile-first, app-like          task console, phone-in-hand     desktop-first, dense
104px collapsing header         56px bar + slide-over rail      240px persistent rail
64px bottom tabs                 no bottom tabs                 grouped 20-route rail
sheets, cards, horizontal rails  card rows + tables             DataTable everywhere
max-w 1600                      max-w 1280                     max-w 1400
```

### Why these three must not share a shell
A store manager opening their console wants exactly one thing on screen: *what do I have to
do right now*. Customer chrome (search bar, offers rail, cart) is pure noise there, and a
shared layout means every customer-side experiment risks breaking order fulfilment. The
route group split costs nothing — URLs are unchanged — and buys an independent visual
language per role. It is the single highest-leverage structural change in this plan.

### Why navy for the internal tools
Saffron is the customer's "act now" colour. If admins and managers also see saffron
buttons all day, the colour stops meaning *customer action*. Navy reads as authority,
stays legible at 16:1 with white, and lets you know instantly which app you're in — the
same trick Swiggy uses between its customer app (orange) and partner app (different
chrome entirely).
