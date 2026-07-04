# Gjanand Sarkar Design System (Phase 1)

This document defines the foundational UI guidelines and components for the Gjanand Sarkar frontend. It is designed to be highly reusable, accessible, and fast, serving as a clean slate for all future UI construction without relying heavily on arbitrary values.

## 1. Design Principles
- **Speed & Clarity**: Maximize perceived performance via minimalistic styles and skeleton loaders.
- **Mobile-first**: Scale touch targets (buttons minimum 44px on mobile) and responsive fonts appropriately.
- **Accessibility**: Support keyboard navigation, maintain visible focus states, and ensure WCAG AA contrast ratio compliance.
- **Reusability**: Build modular generic primitives (`QuantityStepper`, `PriceDisplay`) rather than heavy monoliths.

## 2. Design Tokens

The core visual tokens are defined in `src/app/globals.css` using Tailwind v4's native `@theme` directives.

### Color System
- **Primary**: Deep Meadow (`#3f6530`) – Used for main call-to-actions.
- **Secondary**: Terracotta (`#8a5025`) – Used for accents.
- **Surface**: Background (`#fafaf3`), Card Surface (`#ffffff`), Muted Surface (`#f4f4ed`).
- **Semantic**: Success (`#3b8a55`), Warning (`#c78c2e`), Error (`#ba1a1a`), Info (`#4a90d9`).

### Typography (Inter)
- **Display**: `.text-display` (48px)
- **Headings**: `.text-h1` to `.text-h3` (32px to 20px)
- **Body**: `.text-body-lg`, `.text-body-md`, `.text-body-sm` (16px to 13px)
- **Caption**: `.text-caption` (12px, for meta info)

### Shadow & Radius Scales
- **Shadows**: `.shadow-sm`, `.shadow-md`, `.shadow-lg`, `.shadow-card`, `.shadow-card-hover`, `.shadow-modal`.
- **Radius**: `.rounded-xs` (4px) to `.rounded-2xl` (32px), with cards typically using `.rounded-2xl` (16px mapping to custom if needed) and buttons using `.rounded-xl`.

## 3. Component Inventory

### Core UI
- **Button**: Uses standard variants (`default`, `secondary`, `outline`, `ghost`, `link`, `destructive`). Uses `cva` and full Tailwind utility classes instead of inline styles.
- **Input**: Unified styling with proper focus rings (`focus-visible:ring-2 focus-visible:ring-ring`).
- **Card**: Lightweight container (`bg-surface`, `rounded-2xl`, `shadow-card`).
- **Badge**: Tiny labels for status (`default`, `success`, `warning`, `destructive`, `outline`).
- **Skeleton / Loader**: Core animation primitives (`animate-pulse-slow` / `animate-spin`).

### Commerce Primitives
- **PriceDisplay**: Centralizes the logic to render price tags with an optional original price strikethrough.
- **QuantityStepper**: Generic `+` and `-` controller, decoupled from cart business logic for reusability.

## 4. Usage Examples

### Button
```tsx
import { Button } from "@/components/ui/Button"

<Button variant="default" size="lg">Add to Cart</Button>
<Button variant="outline">View Details</Button>
```

### PriceDisplay
```tsx
import { PriceDisplay } from "@/components/shared/PriceDisplay"

<PriceDisplay price={45} originalPrice={55} size="lg" />
```

### QuantityStepper
```tsx
import { QuantityStepper } from "@/components/shared/QuantityStepper"

<QuantityStepper 
  quantity={cartQty} 
  onIncrement={() => setQty(q => q + 1)}
  onDecrement={() => setQty(q => Math.max(0, q - 1))}
/>
```

## 5. Accessibility Notes
- Use `lucide-react` icons appropriately with `aria-hidden="true"` when they are purely decorative.
- Ensure all interactive elements (like the `+`/`-` stepper) have readable `aria-label`s.
- `Button` and `Input` inherit focus rings naturally from the standardized design system.
