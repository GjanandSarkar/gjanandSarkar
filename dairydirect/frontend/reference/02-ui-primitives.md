# 02 — UI primitives

```
CONTEXT
Read 00-AGENT-CONTEXT.md first and complete its STEP 0 repo map. Phase 1 (tokens + fonts)
must already be merged: globals.css has the GSS v2 tokens, and --font-ui/--font-display exist.

GOAL
Rebuild every primitive in src/components/ui/ so they consume only GSS v2 tokens, expose all
states, and look identical to a top-tier Indian q-commerce app. No page-level layout changes yet.

FILES YOU WILL TOUCH
src/components/ui/Button.tsx, Card.tsx, Badge.tsx, Input.tsx, Dialog.tsx, Skeleton.tsx,
Select.tsx, Tabs.tsx, Switch.tsx, Loader.tsx.
Add: src/components/ui/Sheet.tsx, src/components/ui/EmptyState.tsx, src/lib/motion.ts
(variants only, no components).

BUTTON — the contract (keep the existing export name and prop names; ADD, don't rename)
  variant: 'brand' | 'navy' | 'outline' | 'ghost' | 'danger' | 'success'
  size:    'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean      -> replaces label with a 16px spinner, sets aria-busy, disables
  fullWidth?: boolean
  leftIcon?/rightIcon?: ReactNode

  Specs:
    height 36 / 44 / 52px · radius var(--radius-md) · font-weight 600 · gap 8px
    transition: transform, background-color, box-shadow
                duration var(--dur-state) ease var(--ease-standard)
    active:scale-[0.97] duration var(--dur-press)
    focus-visible: ring 2px var(--brand-ink), offset 2
    disabled: opacity-50 + pointer-events-none + cursor-not-allowed

    brand   = bg-primary text-on-primary shadow-sm
              hover:bg-primary-hover active:bg-primary-active
    navy    = bg-secondary text-on-secondary
    outline = border-border bg-surface text-foreground
              hover:border-border-hover hover:bg-surface-muted
    ghost   = text-foreground-muted hover:bg-surface-muted hover:text-foreground
    danger  = bg-error-bg text-error border-error/20

  IMPORTANT: saffron buttons must use text-on-primary (near-black), never text-white.
  If a caller currently passes a white-text class, leave it and list it in your report.

BADGE — variants: neutral, brand, success, warning, danger, info, navy.
  Height 20px, radius var(--radius-full), text-[11px] font-600, px-2.
  Brand badges: bg-primary-fixed text-brand-ink. Success: bg-success-bg text-success.
  Add prop `dot?: boolean` for the 6px status dot used in order tables.

CARD — props: `elevated?: boolean` (shadow-sm) | `interactive?: boolean`
  interactive: hover:-translate-y-0.5 hover:shadow-md
               transition duration var(--dur-state) ease var(--ease-standard)
  Default: bg-surface border-border radius-card. Padding scale p-3/p-4/p-5 via `padding` prop.

SHEET (new) — Radix Dialog, presented as a bottom sheet under md and a centred dialog above md.
  Mobile: rounded-t-[var(--radius-2xl)], max-h-[88dvh], drag-handle 32x4px,
  slide-up spring (var(--ease-spring), 320ms), backdrop bg-black/45 backdrop-blur-[2px].
  Must include: role="dialog", aria-modal, a visible title (aria-labelledby), Escape to close,
  focus trap (Radix handles it), scroll lock, and body safe-area padding
  (padding-bottom: max(16px, env(safe-area-inset-bottom))).
  Export: <Sheet open onOpenChange> <SheetContent title side="bottom">.

SKELETON — one primitive: <Skeleton className="h-4 w-24" />
  bg-surface-muted + a shimmer (a translated gradient using --color-surface-elevated),
  1.2s infinite, disabled under prefers-reduced-motion (render flat).

INPUT — 44px height, radius var(--radius-md), border-border,
  focus: border-brand-ink + ring-2 ring-ring,
  error: border-error + helper text in text-error text-[12px].
  Support leftIcon/rightIcon slots and a `numeric` prop that adds class `tabular`.

EMPTYSTATE (new) — props: icon?, title, description?, action?. Centered, max-w-sm,
  title text-body-lg font-600, description text-body-sm text-foreground-muted,
  optional 56px illustration slot (accepts an emoji or node).

RULES
• Every file: named export (match the house style you found in STEP 0), forwardRef where a
  DOM ref is plausible, cn() for class merging, no default export unless the codebase
  already does.
• No raw colours. No arbitrary Tailwind values for colour/radius/shadow/duration.
• Do not change how existing callers use these components. Only additive props.

ACCEPTANCE
1. npx tsc --noEmit && npm run lint clean.
2. src/app/design-reference/page.tsx (dev-only page, 404s in prod) is extended into a
   specimen sheet: every Button variant × size × state
   (default/hover/active/focus/loading/disabled), every Badge variant, Card both modes,
   Input 3 states, Skeleton, EmptyState, and one Sheet demo — rendered in light AND dark
   side by side.
3. Report: any component that still contains a raw hex or a text-white-on-saffron.
```

---

## Why a specimen page instead of Storybook

The repo already has `src/app/design-reference/page.tsx` — a dev-only route that 404s in
production and renders every listing state with sample data. Extending it is cheaper than
adding Storybook (no new dependency, no new build), it renders inside the real app shell
with the real fonts and real tokens, and it costs zero bytes in production.

Review rule: **a primitive is not done until it appears on `/design-reference` in both
themes.**

## Component state matrix (the checklist to verify)

| Component | default | hover | active | focus | disabled | loading | error | empty |
|---|---|---|---|---|---|---|---|---|
| Button | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | n/a | n/a |
| Input | ✓ | — | — | ✓ | ✓ | — | ✓ | — |
| Badge | ✓ | — | — | — | — | — | — | — |
| Card | ✓ | ✓ (if interactive) | ✓ | — | — | — | — | — |
| Sheet | ✓ | — | — | ✓ | — | — | — | — |
| Skeleton | ✓ | — | — | — | — | n/a | — | — |
| EmptyState | ✓ | — | — | ✓ (action) | — | — | — | n/a |
