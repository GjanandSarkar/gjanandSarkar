/**
 * Server-side data for the subscription surfaces.
 *
 * Reads go through the service-role client (RLS bypass) but are always scoped
 * to the authenticated `userId` resolved from the signed JWT cookie — never to
 * an id supplied by the caller. Every upstream read is bounded by
 * `withTimeout`, so a slow database degrades to an empty state instead of a
 * blank page.
 */

import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { withTimeout, TIMEOUTS } from '@/lib/utils/timeout';
import { legacyCategoryFilter } from '@/lib/constants/categories';
import type { PlanAddress, PlanProduct, SubscriptionPlan } from './types';
import type { PlanCadence } from './schedule';

export interface SessionUser {
  userId: string;
  role: 'customer' | 'admin' | 'seller';
}

/** Resolve the signed-in user from the httpOnly access-token cookie. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get('gs_access_token')?.value;
  if (!token) return null;

  const payload = await verifyAccessToken(token);
  if (!payload?.userId) return null;

  return { userId: payload.userId, role: payload.role ?? 'customer' };
}

type Row = Record<string, unknown>;

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getPlansForUser(userId: string): Promise<SubscriptionPlan[]> {
  try {
    const sb = getAdminSupabase();
    const { data, error } = await withTimeout(
      async () =>
        sb
          .from('subscriptions')
          .select(
            'id, status, plan, volume, delivery_slot, start_date, next_delivery_date, products(id, name, category, image_url), product_variants(id, weight, price)'
          )
          .eq('user_id', userId)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false }),
      TIMEOUTS.pageData,
      'subscriptions-for-user'
    );

    if (error) throw error;

    return ((data ?? []) as Row[])
      .map((row): SubscriptionPlan | null => {
        const product = one(row.products as Row | Row[] | null);
        if (!product) return null;
        const variant = one(row.product_variants as Row | Row[] | null);
        return {
          id: String(row.id),
          status: (row.status as SubscriptionPlan['status']) ?? 'active',
          plan: (row.plan as PlanCadence) ?? 'daily',
          volume: Number(row.volume ?? 1),
          deliverySlot: String(row.delivery_slot ?? 'morning_6_8'),
          startDate: String(row.start_date ?? '').slice(0, 10),
          nextDeliveryDate: String(row.next_delivery_date ?? '').slice(0, 10),
          product: {
            id: String(product.id),
            name: String(product.name ?? 'Milk'),
            category: String(product.category ?? 'dairy'),
            imageUrl: (product.image_url as string | null) ?? null,
          },
          variant: variant
            ? {
                id: String(variant.id),
                weight: String(variant.weight ?? ''),
                price: Number(variant.price ?? 0),
              }
            : null,
        };
      })
      .filter((p): p is SubscriptionPlan => p !== null);
  } catch (error) {
    console.error('[subscriptions] getPlansForUser failed:', error);
    return [];
  }
}

/** Dairy catalogue for the plan builder — only variants that can be delivered. */
export async function getPlanCatalogue(): Promise<PlanProduct[]> {
  try {
    const sb = getAdminSupabase();
    let query = sb
      .from('products')
      .select(
        'id, name, category, brand, image_url, product_variants(id, weight, price, original_price, stock, available_quantity)'
      )
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .order('name', { ascending: true })
      .limit(40);

    const dairyFilter = legacyCategoryFilter('dairy');
    if (dairyFilter) query = query.or(dairyFilter);

    const { data, error } = await withTimeout(async () => query, TIMEOUTS.pageData, 'plan-catalogue');
    if (error) throw error;

    return ((data ?? []) as Row[])
      .map((row): PlanProduct => {
        const variants = ((row.product_variants ?? []) as Row[])
          .map((v) => ({
            id: String(v.id),
            weight: String(v.weight ?? ''),
            price: Number(v.price ?? 0),
            originalPrice: v.original_price == null ? null : Number(v.original_price),
            availableQuantity: Number(v.available_quantity ?? v.stock ?? 0),
          }))
          .filter((v) => v.price > 0)
          .sort((a, b) => a.price - b.price);

        return {
          id: String(row.id),
          name: String(row.name ?? ''),
          category: String(row.category ?? 'dairy'),
          brand: (row.brand as string | null) ?? null,
          imageUrl: (row.image_url as string | null) ?? null,
          variants,
        };
      })
      .filter((p) => p.variants.length > 0);
  } catch (error) {
    console.error('[subscriptions] getPlanCatalogue failed:', error);
    return [];
  }
}

export async function getAddressesForUser(userId: string): Promise<PlanAddress[]> {
  try {
    const sb = getAdminSupabase();
    const { data, error } = await withTimeout(
      async () =>
        sb
          .from('user_addresses')
          .select('id, label, address, apartment, city, pincode, is_default')
          .eq('user_id', userId)
          .eq('is_deleted', false)
          .order('is_default', { ascending: false })
          .limit(20),
      TIMEOUTS.pageData,
      'addresses-for-user'
    );

    if (error) throw error;

    return ((data ?? []) as Row[]).map((row) => ({
      id: String(row.id),
      label: String(row.label ?? 'Home'),
      line: [row.apartment, row.address, row.city, row.pincode].filter(Boolean).join(', '),
      isDefault: Boolean(row.is_default),
    }));
  } catch (error) {
    console.error('[subscriptions] getAddressesForUser failed:', error);
    return [];
  }
}
