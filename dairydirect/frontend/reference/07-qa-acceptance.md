# 07 — QA & acceptance

```
GOAL
Prove the redesign is finished, accessible, and did not break the product. Produce ONE
document, docs/ui-v2-acceptance.md, filled with real measured numbers — not "looks good".

STEP 1 — WRITE docs/ui-v2-acceptance.md with these sections and fill each one by actually
running the check:

  1. Commands run (paste the exact commands and their output summary)
       npm run lint
       npx tsc --noEmit
       npm run build          (must succeed — this is the real gate)
       npx next build --debug-prerender   (optional, for route-level data errors)
  2. Route coverage table: route | shell | renders | loading | empty | error | dark | mobile
  3. Contrast table: every foreground/background pair used in src/, with computed ratio and
     PASS/FAIL against WCAG AA (4.5 normal, 3.0 large). Use a script, not eyeballs.
  4. Responsive matrix: 320 / 375 / 390 / 414 / 768 / 1024 / 1280 / 1440 / 1920 — for each,
     note horizontal-overflow risk, header height, nav mode.
  5. Lighthouse budget (mobile, throttled) for /home, /products, /cart:
       Performance ≥ 85 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90
       LCP < 2.5s · CLS < 0.1 · TBT < 300ms
  6. Keyboard + screen reader pass: tab order through header, cart, sheets, admin rail;
     Escape closes every overlay; every icon-only button has an accessible name.
  7. Language switch: en → hi → gu, no overflow, no orphaned English strings in nav,
     fonts actually swap (assert computed font-family).
  8. Contract integrity: git diff on src/lib/api/**, src/app/api/**, and every route file
     URL — must be zero, or list and justify.
  9. Known gaps: honest list of what was NOT done.

STEP 2 — CONTRACT INTEGRITY CHECK (run this before anything else)
   git diff --stat origin/ui/ux-improvements -- src/lib/api src/app/api
   git diff origin/ui/ux-improvements -- 'src/**/page.tsx' 'src/**/layout.tsx' \
     | grep -E '^[-+].*(<form|name="|action=|fetch\(|supabase)' || echo "no contract surface touched"
  Expected: no changes to API layers; no changes to form field names or fetch URLs.
  Also dump the type shapes and eyeball them:
   rg -A12 'interface (CatalogProduct|ProductVariant|UserAddress|SellerDashboardData|Order|Subscription)' src/

STEP 3 — CONTRAST SCRIPT
  Write scripts/check-contrast.mjs (node, no deps): map of token pairs -> WCAG ratio -> table.
  Pairs to assert: on-primary/primary, brand-ink/background, foreground/background,
  foreground-muted/background, on-secondary/secondary, success/success-bg, error/error-bg,
  warning/warning-bg, info/info-bg, stocks/surface, border/background (3.0 for UI borders).
  Exit non-zero if any FAIL. Add it to package.json as "check:contrast" and mention adding
  it to CI as an optional next step (do not modify CI config yourself).

STEP 4 — ACCESSIBILITY SWEEP
   • rg '<img ' src/ — every one needs alt (or alt="" + role="presentation").
   • rg 'onClick' src/ — flag any on a <div>/<span> without role+tabIndex+onKeyDown.
   • rg 'aria-label' count vs icon-only buttons count.
   • Confirm one <h1> per page.
   • Confirm focus ring visible on: buttons, links, nav items, table rows, sheet close.
   • Confirm colour is never the only signal for order status (icon or text too).
   Report counts in the doc, not prose.

STEP 5 — SMOKE TEST THE THREE ROLES
   For each, walk the golden path and record it:
     Customer : /home -> product -> add to cart -> cart -> checkout form (don't pay) -> orders
     Franchise: /seller/dashboard -> orders -> accept one -> mark packed -> store -> toggle
     Admin    : /admin -> products -> create/edit (don't save) -> orders -> filter -> export
   Any 500, unhandled promise rejection, or console error is a blocker.

STEP 6 — FINISH
   Add a short "How to extend" section at the end of the doc: where tokens live, how to add a
   font, how to add a nav item in each of the three shells, how to add a status tone.
   Commit the doc. This is the phase-7 commit.

DO NOT
Do not fix the product's backend, dependencies, or CI config in this phase. Record problems
in the "Known gaps" section instead — this phase produces evidence, not new risk.

ACCEPTANCE
docs/ui-v2-acceptance.md exists, every table is filled with real numbers, npm run build
succeeds, the contrast script exits 0, and Known gaps contains at least three honest items.
```

---

## Definition of done — the whole programme

| # | Criterion | Gate |
|---|---|---|
| 1 | All ~60 routes render in the new palette with zero component edits | phase 1 |
| 2 | Four fonts self-hosted; one CSS rule swaps language | phase 1 |
| 3 | Every primitive has all 8 states, shown on `/design-reference` in light + dark | phase 2 |
| 4 | No file in `components/navigation/` over 250 lines | phase 3 |
| 5 | Three visually distinct shells; store manager never sees customer chrome | phases 3–5 |
| 6 | `/seller/*` URLs unchanged after `git mv` | phase 4 |
| 7 | ⌘K navigation + collapsed rail state persists | phase 5 |
| 8 | Five signature interactions; all instant under `prefers-reduced-motion` | phase 6 |
| 9 | Every data surface has loading / empty / error / offline | phase 6 |
| 10 | Contract diff on `src/lib/api`, `src/app/api`, form names = zero | phase 7 |
| 11 | Lighthouse mobile ≥85 perf / ≥95 a11y on /home, /products, /cart | phase 7 |
| 12 | `npm run build` green | phase 7 |

## Commit plan (one commit per phase, squashable)

```
01 feat(design): gss v2 tokens + four self-hosted fonts
02 feat(ui): rebuild primitives on gss tokens, add sheet/empty-state/motion
03 refactor(nav): split 768-line Header into HeaderBar + parts (no behaviour change)
04 feat(customer): mobile-first shell, sticky cart bar, tokenised bottom nav
05 feat(franchise): new (franchise) route group + navy task console
06 feat(admin): grouped rail, command palette, AdminPageShell, DataTable
07 feat(motion): tokenised interactions + loading/empty/error/offline states
08 docs(qa): ui-v2-acceptance with measured contrast, lighthouse, coverage
```
