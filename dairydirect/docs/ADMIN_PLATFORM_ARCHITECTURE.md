# Admin Platform Architecture

## Separation of Concerns

The Gjanand Sarkar Admin Platform is designed with strict separation from the Customer Commerce flow. This ensures:
1. **Bundle Isolation**: Admin libraries (like charts or heavy data grids) do not bloat the customer bundle.
2. **Security**: Admin routes are isolated under the `/admin` path and protected by a separate layout.
3. **Focused UX**: Admin users have a specialized sidebar navigation and density-optimized UI, while customers get a visually rich, conversion-optimized mobile-first UI.

## Routing Structure

The Admin Platform uses Next.js App Router, placed entirely within `src/app/admin`:

```text
src/app/admin/
├── layout.tsx           # Security boundary & Admin Sidebar shell
├── page.tsx             # Operations Dashboard (KPIs)
├── products/            # Product Management (CRUD)
├── categories/          # Category Taxonomy
├── orders/              # Order Fulfillment & Tracking
├── subscriptions/       # Subscription Management
├── customers/           # Customer Directory & LTV
├── analytics/           # Business Overview
└── settings/            # Platform Configuration
```

## Shared Primitives

To maintain design consistency and reduce duplicated code, the Admin Platform reuses the core design system established in Phase 1:
- **Typography & Colors**: Uses CSS variables defined in `src/app/globals.css`.
- **Icons**: Lucide React icons.
- **Animations**: Framer Motion for lists, modals, and page transitions.
- **Database Types**: Directly uses `DBProfile`, `DBProduct`, `DBOrder` from `src/lib/supabase.ts` to prevent schema drift.

## Security Model (RBAC Foundation)

Access to `/admin` is restricted to users with the `role === 'admin'`. Phase 20 introduces the foundation for fine-grained Role-Based Access Control (RBAC) in `src/lib/admin-roles.ts`.

### Roles Defined:
- `super_admin`: Full access to all modules.
- `operations_manager`: Can manage inventory, orders, and customers, but cannot change product definitions.
- `inventory_manager`: Can manage products and stock, but no access to customer data.
- `support_agent`: Can manage orders and subscriptions, read-only customer access.

In Phase 21, these roles will be enforced both at the UI level (hiding sidebar items) and the API level (Supabase RLS policies).
