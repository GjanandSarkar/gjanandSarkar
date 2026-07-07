# Admin & Customer Platform Integration Architecture

This document outlines how the Admin Platform and Customer Platform securely share the same database while maintaining strict authorization controls.

## 1. Core Integration Philosophy
The Admin Platform is the true operational control center for DairyDirect. It operates completely connected to the Customer Platform by reading and writing to the **same Supabase instance in real-time**.

To respect the single-source-of-truth constraint:
- **No Mock Data**: All metrics, tables, and profiles are directly driven by production `profiles`, `orders`, `products`, and `subscriptions` tables.
- **No Duplicate APIs**: The Admin Platform reuses the exact same repository layer (`src/lib/api/*`) as the Customer Platform.

## 2. Row Level Security (RLS) Strategy
The critical enabler for the unified API approach is PostgreSQL's Row Level Security. 

### Customer Access
Customers access the database via the **browser Supabase client**.
- They can only `SELECT`, `UPDATE`, or `INSERT` records where their `auth.uid()` matches the `user_id` of the record (e.g., `orders`, `profiles`, `subscriptions`).

### Admin Access
Admins also access the database via the **browser Supabase client**. 
To allow Admins to bypass the `auth.uid()` restriction without exposing the `SUPABASE_SERVICE_ROLE_KEY` to the client, a custom SQL helper function is used securely in the database:

```sql
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;
```

This `is_admin()` function is evaluated on the database side for every query. If it returns true, the RLS policies grant the admin full `SELECT`, `INSERT`, `UPDATE`, and `DELETE` access across all operational tables.

## 3. Data Flow Diagram

```mermaid
graph TD
    A[Admin User] -->|Logs In| B(Next.js Admin UI)
    C[Customer] -->|Logs In| D(Next.js Customer UI)

    B -->|Calls API| E[src/lib/api/orders.ts]
    D -->|Calls API| E
    
    E -->|Browser Client| F[Supabase PostgreSQL]
    
    F -->|RLS Check: is_admin() = true| G[(Full Access)]
    F -->|RLS Check: auth.uid() = user_id| H[(Scoped Access)]
    
    G --> B
    H --> D
```

## 4. Operational Workflows

### Order Fulfillment
1. **Customer places order**: Handled via `POST /api/orders/route.ts` using the service role key to securely charge and validate inventory.
2. **Admin views order**: The UI calls `getAllOrders()`, which executes a direct browser client query. Because `is_admin()` is true, the DB returns all orders.
3. **Admin updates status**: UI calls `updateOrderStatus()` with `Out for Delivery`. The DB accepts the `UPDATE` because of the admin policy.
4. **Customer view**: Customer sees the live status because they are querying their own `user_id`.

### Product Management
1. **Admin creates product**: Handled via `POST /api/products/route.ts`. The backend verifies `auth.isAdmin` via the `profiles` table before creating the product and variants.
2. **Admin edits product**: Client-side `updateProduct()` uses the browser client. RLS permits the edit.
3. **Customer views product**: RLS policy `Anyone can view products` ensures immediate visibility.

## 5. Known Limitations
- The `is_admin()` helper executes an extra `SELECT` on the `profiles` table for every query. While optimized with indexes and PostgreSQL caching, extremely high concurrent admin traffic may slightly increase database load compared to JWT claims.
- The Admin Platform uses the standard Customer authentication endpoints. There is no isolated Admin portal subdomain; it sits under `/admin` and relies heavily on the `profiles.role` column.
