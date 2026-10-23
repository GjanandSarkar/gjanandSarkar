/**
 * PUT/DELETE /api/categories/[id]
 * Category update & delete endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { invalidateCategoryCache } from '@/lib/aws/redis';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, image_url, icon_name, sort_order } = body;

    const slug = name ? name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;

    let updatedCategory: any = null;

    if (isPgConfigured) {
      try {
        const res = await query(
          `UPDATE categories
           SET name = COALESCE($2, name),
               slug = COALESCE($3, slug),
               description = COALESCE($4, description),
               image_url = COALESCE($5, image_url),
               icon_name = COALESCE($6, icon_name),
               sort_order = COALESCE($7, sort_order),
               updated_at = now()
           WHERE id::text = $1 OR name = $1
           RETURNING *`,
          [id, name?.trim() || null, slug || null, description || null, image_url || null, icon_name || null, sort_order ?? null]
        );
        if (res.rows && res.rows[0]) {
          updatedCategory = res.rows[0];
        }
      } catch (err: any) {
        console.warn('[Category PUT] RDS update warning:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const updates: any = {};
    if (name) {
      updates.name = name.trim();
      updates.slug = slug;
    }
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;
    if (icon_name !== undefined) updates.icon_name = icon_name;
    if (sort_order !== undefined) updates.sort_order = sort_order;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let queryBuilder = sb.from('categories').update(updates);
    if (isUuid) {
      queryBuilder = queryBuilder.eq('id', id);
    } else {
      queryBuilder = queryBuilder.eq('name', id);
    }

    const { data: sbData, error: sbErr } = await queryBuilder.select().maybeSingle();

    if (sbErr) {
      console.error('[Category PUT] Supabase error:', sbErr);
    }

    if (sbData) {
      updatedCategory = updatedCategory || sbData;
    }

    if (!updatedCategory) {
      return NextResponse.json({ error: sbErr?.message || 'Category not found or failed to update' }, { status: 404 });
    }

    // Invalidate category cache
    invalidateCategoryCache().catch(() => {});

    return NextResponse.json({ success: true, category: updatedCategory });
  } catch (error: any) {
    console.error('[Category PUT] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    if (isPgConfigured) {
      try {
        await query('DELETE FROM categories WHERE id::text = $1 OR name = $1', [id]);
      } catch (err: any) {
        console.warn('[Category DELETE] RDS warning:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    /* Refuse to delete a category that still has products.

       Deleting one used to orphan every product referencing it, and because
       GET re-seeded category names from products.category the row would then
       reappear -- so the delete looked like it had silently failed. Report
       the conflict instead of destroying the link. */
    const { data: catRow } = await sb
      .from('categories')
      .select('id, name')
      .eq(isUuid ? 'id' : 'name', id)
      .maybeSingle();

    if (!catRow) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const { count: linkedCount } = await sb
      .from('products')
      .select('id', { count: 'exact', head: true })
      .or(`category_id.eq.${catRow.id},category.eq.${catRow.name}`);

    if ((linkedCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete "${catRow.name}": ${linkedCount} product(s) still use this category. Reassign or remove them first.`,
          product_count: linkedCount,
        },
        { status: 409 }
      );
    }

    const deleteQuery = isUuid
      ? sb.from('categories').delete().eq('id', id)
      : sb.from('categories').delete().eq('name', id);

    const { error: sbErr } = await deleteQuery;
    if (sbErr) {
      console.error('[Category DELETE] Supabase delete error:', sbErr);
      return NextResponse.json({ error: sbErr.message || 'Failed to delete category' }, { status: 500 });
    }

    // Invalidate category cache
    invalidateCategoryCache().catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Category DELETE] Error:', error.message);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
