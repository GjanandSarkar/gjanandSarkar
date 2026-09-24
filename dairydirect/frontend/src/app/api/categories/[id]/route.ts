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

    const { data: sbData } = await sb
      .from('categories')
      .update(updates)
      .or(`id.eq.${id},name.eq.${id}`)
      .select()
      .maybeSingle();

    if (sbData) {
      updatedCategory = updatedCategory || sbData;
    }

    // Invalidate category cache
    invalidateCategoryCache().catch(() => {});

    return NextResponse.json({ success: true, category: updatedCategory || { id, ...updates } });
  } catch (error: any) {
    console.error('[Category PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
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
    await sb.from('categories').delete().or(`id.eq.${id},name.eq.${id}`);

    // Invalidate category cache
    invalidateCategoryCache().catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Category DELETE] Error:', error.message);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
