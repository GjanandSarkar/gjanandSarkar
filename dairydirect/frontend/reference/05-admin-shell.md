# 05 — Admin shell

```
CONTEXT
src/app/admin/layout.tsx already has AdminSidebar, an RBAC redirect, a mobile drawer, and a
max-w-[1400px] container. Good bones. It does not scale to 20 routes: the rail is flat,
there is no way to jump, and every admin page invents its own table and its own loading state.

GOAL
Turn admin into a real operations console: grouped rail, keyboard command palette, one page
shell, one data table, one status→colour map.

STEP 1 — NAV CONFIG
  src/app/admin/_nav.ts
    type AdminNavItem = { href, label, icon, badgeKey?, exact? }
    type AdminNavGroup = { group: string, items: AdminNavItem[] }
  Groups (read the real route list with:
    find src/app/admin -name page.tsx | sort
  and place every route into one of these; do not invent routes that don't exist):
    OVERVIEW     dashboard, reports, analytics
    CATALOG      products, categories, inventory, pricing
    COMMERCE     orders, returns, payments, offers/coupons
    PEOPLE       customers, sellers/franchises, riders, users & roles
    OPERATIONS   delivery slots, service areas, notifications, support
    SYSTEM       settings, audit log, integrations
  If a route in the real tree doesn't fit, add a group — don't force it.

STEP 2 — RAIL
  Desktop ≥1024px: 240px, collapsible to 68px icon-only.
    • Collapse toggle at the top; persist choice in localStorage key `gss.admin.rail`.
    • Collapsed: tooltips on hover (title attr is enough), active item keeps a 3px left navy bar.
    • Group labels: text-micro uppercase tracking-wide text-foreground-muted, hidden when collapsed.
    • Active item: bg-secondary/8 text-secondary font-600 + 3px left bar.
    • Badge chips on items with counts (pending orders, open tickets) using Badge variant="danger".
  Mobile: existing drawer, same config.

STEP 3 — COMMAND PALETTE (new)
  src/components/admin/CommandPalette.tsx
    • Trigger: ⌘K / Ctrl+K globally, and a "Search or jump to…" button in the page shell header.
    • Use cmdk if already in package.json; otherwise build a 60-line filtered list — do not add
      a new dependency without checking first.
    • Groups: navigate (from _nav.ts), recent (last 6 visited admin routes, localStorage),
      actions (Open palette: create product, export orders, etc. — only ones that exist).
    • Keyboard: ↑↓ navigate, ⏎ go, esc close. Fuzzy match on label + group.
    • Styled with the same Sheet/Dialog primitive from phase 2.

STEP 4 — SHARED PAGE SHELL
  src/components/admin/AdminPageShell.tsx
    props { title, description?, breadcrumbs?, actions?, tabs?, children, isLoading?, error? }
    Renders a sticky page header (h-14, border-b, bg-surface/80 backdrop-blur) with title +
    actions on the right, then content in a max-w-[var(--w-admin)] container with p-4 md:p-6.
    Handles the loading branch (title skeleton + 3 skeleton rows) and the error branch
    (EmptyState with retry) so pages stop hand-rolling them.

STEP 5 — DATA TABLE
  src/components/admin/DataTable.tsx  (generic, headless-ish)
    Generic over T: columns: { key, header, render?, sortable?, align?, width? }[]
    Required states: loading (8 skeleton rows, same column widths), empty (EmptyState inside
    the tbody area), error (retry button), and a footer summary row.
    Behaviour: sortable headers with an aria-sort attribute, sticky header, zebra-free rows
    with hover:bg-surface-muted, row-click navigation, row selection with a header checkbox,
    bulk action bar that slides in above the table when ≥1 row is selected.
    Mobile: below md the table becomes stacked cards (each row -> a Card with label/value pairs).
    Pagination: keep whatever the existing pages use; do not introduce a new fetching pattern.

STEP 6 — STATUS TONE MAP
  src/lib/statusTone.ts
    export const statusTone: Record<string, 'success'|'warning'|'danger'|'info'|'neutral'> = {
      // fill from the real status enums found in src/lib/api and the DB types
      // orders: pending, confirmed, packed, out_for_delivery, delivered, cancelled, refunded
      // subscriptions: active, paused, cancelled, expired
      // merchants: pending, approved, suspended
    }
  Plus `export function toneFor(status: string)` with a safe 'neutral' fallback.
  Replace every ad-hoc status colour condition in src/app/admin/** and src/components/admin/**
  with a <Badge variant={toneFor(status)}>.

DO NOT
Do not change the RBAC logic in admin/layout.tsx, any server action, any API route under
src/app/api/**, or the query shapes. Styling and orchestration only.

ACCEPTANCE
1. Every route under src/app/admin appears in the rail exactly once; no dead links.
2. ⌘K opens from any admin page, arrow keys + ⏎ navigate, and recents persist across reload.
3. Rail collapsed state survives reload.
4. Every admin page uses AdminPageShell (rg for hand-rolled header markup — the count should
   go to zero, or you report what remains and why).
5. DataTable's loading/empty/error states are all exercised in design-reference.
6. rg 'text-(green|red|yellow|blue)-[0-9]{3}' src/app/admin src/components/admin → 0 matches.
```

---

## Admin information architecture

```
OVERVIEW      Dashboard · Reports · Analytics
CATALOG       Products · Categories · Inventory · Pricing
COMMERCE      Orders · Returns · Payments · Offers
PEOPLE        Customers · Sellers · Riders · Users & Roles
OPERATIONS    Delivery slots · Service areas · Notifications · Support
SYSTEM        Settings · Audit log · Integrations
```

### Why a command palette and not better menus
Twenty routes is past the point where a human scans a sidebar — they stop reading and start
hunting. ⌘K inverts that: the operator types "ord" and is in Orders in 300ms, without
looking away from the keyboard. Zepto's Control Tower and every mature ops console converge
on this. It costs ~80 lines because navigation is already declarative in `_nav.ts`.

### Why one DataTable
Right now each admin page re-implements loading, empty, error and pagination slightly
differently, which is why some pages flash an unstyled table and others show nothing at all.
One generic component means a fix to row density or mobile stacking lands everywhere at
once — the same reason Blinkit mirrors its Constants/Elements/Components folders into a
single design library.

### Row density
`compact` (36px rows) for admin, `comfortable` (44px) for franchise. Managers tap rows with
gloves on; admins use a mouse.
