/**
 * GET/POST /api/categories
 * Category Management API with AWS PostgreSQL + Supabase Fallback.
 * Fetches real categories from the categories table and syncs product categories.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getCachedCategories, cacheCategories, invalidateCategoryCache } from '@/lib/aws/redis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Check Redis cache first (30 min TTL) only if non-empty and not force-refreshing
    if (!forceRefresh) {
      const cachedCategories = await getCachedCategories();
      if (Array.isArray(cachedCategories) && cachedCategories.length > 0) {
        return NextResponse.json(
          { categories: cachedCategories },
          { headers: { 'X-Cache': 'HIT' } }
        );
      }
    }

    // 1. Try RDS PostgreSQL query
    if (isPgConfigured) {
      try {
        const result = await query(
          `SELECT 
             c.id, c.name, c.slug, c.description, c.image_url, c.icon_name, c.is_active, c.sort_order, c.metadata, c.created_at, c.updated_at,
             COUNT(p.id)::int as product_count
           FROM categories c
           LEFT JOIN products p ON (
             p.category_id = c.id 
             OR LOWER(p.category) = LOWER(c.name)
             OR LOWER(p.category) LIKE '%' || LOWER(c.name) || '%'
             OR LOWER(c.name) LIKE '%' || LOWER(p.category) || '%'
           )
           GROUP BY c.id
           ORDER BY c.sort_order ASC, c.name ASC`
        );
        if (result.rows && result.rows.length > 0) {
          // Cache and return
          cacheCategories(result.rows).catch(() => {});
          return NextResponse.json(
            { categories: result.rows },
            { headers: { 'X-Cache': 'MISS' } }
          );
        }
      } catch (err: any) {
        console.warn('[Categories GET] RDS query failed, falling back to Supabase:', err.message);
      }
    }

    // 2. Supabase Fallback
    const sb = getAdminSupabase();

    // Fetch categories table
    let { data: catData, error: catErr } = await sb
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    // Fetch products to count items per category
    const { data: productsData } = await sb.from('products').select('id, category, category_id');

    // Auto-sync missing categories from products table into categories table
    const existingNames = new Set((catData || []).map((c: any) => (c.name || '').toLowerCase()));
    const missingFromProducts: string[] = [];

    (productsData || []).forEach((p: any) => {
      if (p.category && !existingNames.has(p.category.toLowerCase()) && !missingFromProducts.includes(p.category)) {
        missingFromProducts.push(p.category);
      }
    });

    if (missingFromProducts.length > 0) {
      try {
        const newCategoryInserts = missingFromProducts.map((catName, i) => ({
          name: catName,
          slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          sort_order: (catData?.length || 0) + i + 1,
          is_active: true,
        }));
        await sb.from('categories').insert(newCategoryInserts);

        // Re-query categories table
        const { data: refreshedCatData } = await sb
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });

        if (refreshedCatData) {
          catData = refreshedCatData;
        }
      } catch {}
    }

    const categories = (catData || []).map((c: any) => {
      const cNameLower = (c.name || '').toLowerCase().trim();
      const count = (productsData || []).filter((p: any) => {
        if (p.category_id && String(p.category_id) === String(c.id)) return true;
        if (!p.category) return false;
        const pCatLower = String(p.category).toLowerCase().trim();
        return (
          pCatLower === cNameLower ||
          pCatLower.includes(cNameLower) ||
          cNameLower.includes(pCatLower)
        );
      }).length;

      return {
        ...c,
        product_count: count,
      };
    });

    // Cache categories before returning
    cacheCategories(categories).catch(() => {});

    return NextResponse.json(
      { categories },
      { headers: { 'X-Cache': 'MISS' } }
    );
  } catch (error: any) {
    console.error('[Categories GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, image_url, icon_name, sort_order } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let createdCategory: any = null;

    // 1. Try RDS PostgreSQL
    if (isPgConfigured) {
      try {
        const res = await query(
          `INSERT INTO categories (name, slug, description, image_url, icon_name, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (name) DO UPDATE
           SET description = COALESCE(EXCLUDED.description, categories.description),
               image_url = COALESCE(EXCLUDED.image_url, categories.image_url),
               icon_name = COALESCE(EXCLUDED.icon_name, categories.icon_name),
               sort_order = COALESCE(EXCLUDED.sort_order, categories.sort_order),
               updated_at = now()
           RETURNING *`,
          [cleanName, slug, description || null, image_url || null, icon_name || null, sort_order || 0]
        );
        if (res.rows && res.rows[0]) {
          createdCategory = res.rows[0];
        }
      } catch (err: any) {
        console.warn('[Categories POST] RDS insert failed, trying Supabase:', err.message);
      }
    }

    // 2. Try Supabase Table
    const sb = getAdminSupabase();
    const { data: sbData, error: sbErr } = await sb
      .from('categories')
      .upsert(
        {
          name: cleanName,
          slug,
          description: description || null,
          image_url: image_url || null,
          icon_name: icon_name || null,
          sort_order: sort_order || 0,
        },
        { onConflict: 'name' }
      )
      .select()
      .maybeSingle();

    if (!sbErr && sbData) {
      createdCategory = createdCategory || sbData;
    }

    if (!createdCategory) {
      createdCategory = {
        id: `cat-${Date.now()}`,
        name: cleanName,
        slug,
        description: description || null,
        image_url: image_url || null,
        icon_name: icon_name || null,
        sort_order: sort_order || 0,
        product_count: 0,
      };
    }

    // Invalidate category cache so next GET fetches fresh data
    invalidateCategoryCache().catch(() => {});

    return NextResponse.json({ success: true, category: createdCategory });
  } catch (error: any) {
    console.error('[Categories POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
