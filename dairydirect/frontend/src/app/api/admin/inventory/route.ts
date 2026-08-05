/**
 * GET/PUT /api/admin/inventory
 * Inventory management — stock levels, alerts, bulk updates.
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/aws/rds';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { writeAuditLog } from '@/lib/security/audit';
import { invalidateProductsCache } from '@/lib/aws/redis';
import { z } from 'zod';

// ─── GET /api/admin/inventory ─────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'low_stock' | 'out_of_stock' | 'all'

    let whereClause = '';
    if (filter === 'low_stock') {
      whereClause = 'WHERE pv.stock <= pv.low_stock_threshold AND pv.stock > 0';
    } else if (filter === 'out_of_stock') {
      whereClause = 'WHERE pv.stock = 0';
    }

    const result = await query(
      `SELECT 
         pv.id as variant_id,
         pv.weight,
         pv.stock,
         pv.low_stock_threshold,
         pv.price,
         pv.cost_price,
         pv.is_available,
         pv.expiry_date,
         pv.batch_number,
         p.id as product_id,
         p.name as product_name,
         p.category,
         p.image_url,
         p.is_active as product_active,
         CASE 
           WHEN pv.stock = 0 THEN 'out_of_stock'
           WHEN pv.stock <= pv.low_stock_threshold THEN 'low_stock'
           ELSE 'in_stock'
         END as stock_status
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       ${whereClause}
       ORDER BY 
         CASE WHEN pv.stock = 0 THEN 0
              WHEN pv.stock <= pv.low_stock_threshold THEN 1
              ELSE 2 END ASC,
         pv.stock ASC,
         p.name ASC`
    );

    // Summary stats
    const statsResult = await query(`
      SELECT
        COUNT(*) FILTER (WHERE pv.stock = 0) as out_of_stock,
        COUNT(*) FILTER (WHERE pv.stock > 0 AND pv.stock <= pv.low_stock_threshold) as low_stock,
        COUNT(*) FILTER (WHERE pv.stock > pv.low_stock_threshold) as in_stock,
        SUM(pv.stock * pv.cost_price) as total_inventory_value
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE p.is_active = true
    `);

    return NextResponse.json({
      variants: result.rows,
      stats: statsResult.rows[0],
    });
  } catch (error: any) {
    console.error('[Inventory GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

// ─── PUT /api/admin/inventory ─────────────────────────────────
const UpdateStockSchema = z.object({
  updates: z.array(z.object({
    variantId: z.string().uuid(),
    stock: z.number().int().min(0),
    low_stock_threshold: z.number().int().min(0).optional(),
    batch_number: z.string().max(50).optional(),
    expiry_date: z.string().optional().nullable(),
  })).min(1).max(100),
});

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = UpdateStockSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { updates } = parseResult.data;

    // Get current stock for audit
    const variantIds = updates.map(u => u.variantId);
    const currentStockResult = await query<{ id: string; stock: number; weight: string }>(
      'SELECT id, stock, weight FROM product_variants WHERE id = ANY($1::uuid[])',
      [variantIds]
    );
    const currentStocks = Object.fromEntries(currentStockResult.rows.map(r => [r.id, r]));

    await withTransaction(async (client) => {
      for (const update of updates) {
        const setClause = [];
        const values: any[] = [update.variantId];
        let paramIdx = 2;

        setClause.push(`stock = $${paramIdx++}`);
        values.push(update.stock);

        if (update.low_stock_threshold !== undefined) {
          setClause.push(`low_stock_threshold = $${paramIdx++}`);
          values.push(update.low_stock_threshold);
        }

        if (update.batch_number !== undefined) {
          setClause.push(`batch_number = $${paramIdx++}`);
          values.push(update.batch_number);
        }

        if (update.expiry_date !== undefined) {
          setClause.push(`expiry_date = $${paramIdx++}`);
          values.push(update.expiry_date);
        }

        setClause.push('is_available = (stock > 0)');
        setClause.push('updated_at = now()');

        await client.query(
          `UPDATE product_variants SET ${setClause.join(', ')} WHERE id = $1`,
          values
        );
      }

      // Resolve inventory alerts for restocked items
      const restockedIds = updates.filter(u => u.stock > 0).map(u => u.variantId);
      if (restockedIds.length > 0) {
        await client.query(
          'UPDATE inventory_alerts SET is_resolved = true, resolved_at = now() WHERE variant_id = ANY($1::uuid[]) AND is_resolved = false',
          [restockedIds]
        );
      }
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.userId,
      action: 'stock.update',
      resourceType: 'inventory',
      resourceId: variantIds.join(','),
      details: {
        updates: updates.map(u => ({
          variantId: u.variantId,
          weight: currentStocks[u.variantId]?.weight,
          before: currentStocks[u.variantId]?.stock,
          after: u.stock,
        })),
      },
      ipAddress: getClientIP(request),
    });

    await invalidateProductsCache();

    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error: any) {
    console.error('[Inventory PUT] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to update stock' }, { status: 500 });
  }
}
