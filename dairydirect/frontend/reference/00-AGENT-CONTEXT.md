# 00 — AGENT CONTEXT (paste this first, every Antigravity session)

```
ROLE
You are a senior frontend engineer + product designer working on a Next.js 16 (App Router,
Turbopack), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Radix UI, Zustand, Supabase
codebase called "Gjanand Sarkar" — an India-first multi-category marketplace with three
audiences: customers, franchise/store partners, and admins.

STEP 0 — MAP THE REPO BEFORE YOU TOUCH ANYTHING (do this every session)
Read and summarise, in your own words, before proposing changes:
  1.  src/app/globals.css                        (existing @theme tokens + .dark block)
  2.  src/app/layout.tsx                         (fonts, providers)
  3.  src/app/(customer)/layout.tsx              (customer shell)
  4.  src/app/admin/layout.tsx                   (admin shell, RBAC pattern)
  5.  src/components/navigation/*.tsx            (Header, TopBar, CategoryNavBar, Footer)
  6.  src/components/shared/BottomNav.tsx
  7.  src/components/ui/*.tsx                    (Button, Card, Badge, Input, Dialog, Skeleton…)
  8.  src/components/shared/ProductCard.tsx
  9.  src/app/(customer)/seller/dashboard/page.tsx
Then print:
  (a) the current token names,
  (b) the house style for components (named vs default export, "use client" placement, cn() usage),
  (c) anything in the codebase that contradicts the instructions I give you.
Wait for my go-ahead before editing.

HARD CONSTRAINTS — violating any of these is a failed task
• NEVER modify:
    src/lib/api/**
    src/app/api/**
    src/lib/supabase/**
    src/lib/aws/**
    src/lib/inventory/**
    src/lib/security/**
    src/lib/validation/**
    database/**
• NEVER change an existing route slug. You MAY move page files between route groups
  (folders in parentheses) because route groups do not affect URLs.
• NEVER rename or remove fields of data objects passed between layers:
    CatalogProduct, ProductVariant, UserAddress, SellerDashboardData, Order, Subscription.
• NEVER change form field `name=` attributes, or the object shape passed into any
  function imported from src/lib/api/**. Those are the API contract.
• NEVER change what `useStore` selectors return.
• Allowed: className changes, JSX restructure, new presentational components under
  src/components/**, new layouts/shells, CSS/token changes, font changes, adding pages.

STYLE RULES
• Tokens only. A raw hex, rgb(), or arbitrary value like text-[13px] in a .tsx file is a bug.
  Use semantic classes: bg-surface, text-foreground-muted, border-border, text-brand-ink…
• Motion: only these curves/durations exist —
    ease-[var(--ease-standard)] etc., durations var(--dur-press|state|nav|hero).
  No ad-hoc `transition={{ duration: 0.37 }}`.
• Every interactive element: focus-visible ring present, min 44×44 tap target.
• Every list has three designed states: loading (skeleton matching final layout), empty, error.
• Mobile-first: write base styles for 390px, add sm:/md:/lg: upward. Never desktop-default.
• Accessibility: icon-only buttons need aria-label; sheets need role="dialog" + Escape +
  focus trap.

WORKFLOW (mandatory)
1. Print a file-by-file plan as a checklist. Do not edit until I say "go".
2. Make changes in small, revertible steps. One concern per commit.
3. After each step run:  npx tsc --noEmit && npm run lint
4. At the end of each step, output: files changed, why, what to check visually,
   and how to revert.

OUTPUT CONTRACT
Never dump entire long files. Show only the hunks you changed, with enough surrounding
context to locate them, plus a one-line summary per file.
```

---

## Why this file exists

Antigravity does not know your repo. Without Step 0 it will invent a parallel
architecture (its own tokens, its own Button, its own shell) and you will spend a week
merging two competing design systems.

Step 0 forces it to read the real thing first. The Hard Constraints are the boundary
that protects your working backend while the entire front end changes underneath it.

## Repo facts this pack assumes (verify in Step 0)

| Fact | Where |
|---|---|
| Next.js 16.2, React 19.2, Tailwind 4 (`@tailwindcss/postcss`) | `package.json` |
| Tokens already exist in `@theme` + `:root` + `.dark` | `src/app/globals.css` |
| Inter is already self-hosted + preloaded | `src/app/layout.tsx`, `src/fonts/` |
| Customer shell = TopBar + Header + CategoryNavBar + main + Footer + BottomNav | `src/app/(customer)/layout.tsx` |
| `Header.tsx` is 768 lines and must be split | `src/components/navigation/Header.tsx` |
| Admin shell already has sidebar + drawer + RBAC | `src/app/admin/layout.tsx` |
| 4 seller pages live *inside* the customer route group | `src/app/(customer)/seller/*` |
| 60+ routes total | `src/app/**/page.tsx` |

## Two blockers to fix before any prompting

1. **`npm ci` fails** — `package-lock.json` is out of sync
   (`Missing: @emnapi/runtime@1.11.3`, `@emnapi/core@1.11.3`).
   Fix: `npm install`, commit the regenerated lockfile. Tell the agent:
   *"do not modify dependency versions, only regenerate the lockfile."*

2. **`/home` hangs on a cold dev start** (~10 min, never responds) because the data
   layer waits on an unreachable database with no timeout.
   Fix: add `connectionTimeoutMillis: 3000` to the pg/Supabase client and render the
   skeleton when the data layer is unreachable. Without this you cannot visually QA
   anything.
