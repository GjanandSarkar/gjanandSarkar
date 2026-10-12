/**
 * GET/POST /api/inventory/status
 * Authoritative single-source-of-truth live inventory endpoint.
 * Returns up-to-the-millisecond available_quantity, stock, and status
 * for specified variant IDs without any intermediary caching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const variantIds: string[] = body.variantIds || [];

    if (!Array.isArray(variantIds) || variantIds.length === 0) {
      return NextResponse.json({ error: 'variantIds array required' }, { status: 400 });
    }

    const sb = getAdminSupabase();
    const { data: variants, error } = await sb
      .from('product_variants')
      .select('id, product_id, weight, price, stock, reserved_quantity, available_quantity, low_stock_threshold')
      .in('id', variantIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const inventoryMap: Record<string, {
      variantId: string;
      productId: string;
      stock: number;
      reservedQuantity: number;
      availableQuantity: number;
      lowStockThreshold: number;
      isOutOfStock: boolean;
      isLowStock: boolean;
    }> = {};

    for (const v of variants || []) {
      const avail = v.available_quantity ?? (v.stock - (v.reserved_quantity || 0));
      inventoryMap[v.id] = {
        variantId: v.id,
        productId: v.product_id,
        stock: v.stock,
        reservedQuantity: v.reserved_quantity || 0,
        availableQuantity: Math.max(0, avail),
        lowStockThreshold: v.low_stock_threshold || 10,
        isOutOfStock: avail <= 0,
        isLowStock: avail > 0 && avail <= (v.low_stock_threshold || 10),
      };
    }

    return NextResponse.json(
      { inventory: inventoryMap, variants: variants || [] },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variantId');
    const variantIdsParam = searchParams.get('variant_ids') || searchParams.get('variantIds');

    const sb = getAdminSupabase();

    if (variantIdsParam) {
      const ids = variantIdsParam.split(',').map((s) => s.trim()).filter(Boolean);
      const { data: variants, error } = await sb
        .from('product_variants')
        .select('id, product_id, weight, price, stock, reserved_quantity, available_quantity, low_stock_threshold')
        .in('id', ids);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        variants: variants || []
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    if (!variantId) {
      return NextResponse.json({ error: 'variantId or variant_ids query param required' }, { status: 400 });
    }

    const { data: variant, error } = await sb
      .from('product_variants')
      .select('id, product_id, weight, price, stock, reserved_quantity, available_quantity, low_stock_threshold')
      .eq('id', variantId)
      .maybeSingle();

    if (error || !variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    const avail = variant.available_quantity ?? (variant.stock - (variant.reserved_quantity || 0));

    return NextResponse.json({
      variantId: variant.id,
      productId: variant.product_id,
      stock: variant.stock,
      reservedQuantity: variant.reserved_quantity || 0,
      availableQuantity: Math.max(0, avail),
      isOutOfStock: avail <= 0,
      isLowStock: avail > 0 && avail <= (variant.low_stock_threshold || 10),
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
