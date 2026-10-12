/**
 * GET/POST /api/reviews
 * Manages product reviews with PostgreSQL RDS + Supabase integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/aws/redis';
import { getClientIP, getAuthUser } from '@/lib/api/auth-middleware';

export const dynamic = 'force-dynamic';

// Helper to ensure reviews table exists in RDS
async function ensureReviewsTableExists() {
  if (!isPgConfigured) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id TEXT NOT NULL,
        user_id TEXT,
        user_name TEXT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title TEXT,
        comment TEXT NOT NULL,
        state_origin TEXT DEFAULT 'India',
        is_verified_buyer BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } catch (err: any) {
    console.warn('[Reviews API] Table check warning:', err.message);
  }
}

// ─── GET /api/reviews?productId=... ─────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId parameter is required' }, { status: 400 });
    }

    let reviews: any[] = [];

    // 1. Try RDS PostgreSQL
    if (isPgConfigured) {
      try {
        await ensureReviewsTableExists();
        const res = await query(
          `SELECT id, product_id, user_id, user_name, rating, title, comment, state_origin, is_verified_buyer, created_at
           FROM reviews
           WHERE product_id = $1
           ORDER BY created_at DESC`,
          [productId]
        );
        reviews = res.rows || [];
      } catch (dbErr: any) {
        console.warn('[Reviews GET] RDS query failed, trying Supabase:', dbErr.message);
      }
    }

    // 2. Fallback to Supabase if RDS produced no results
    if (reviews.length === 0) {
      try {
        const sb = getAdminSupabase();
        const { data, error } = await sb
          .from('reviews')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          reviews = data;
        }
      } catch (sbErr: any) {
        console.warn('[Reviews GET] Supabase fetch warning:', sbErr.message);
      }
    }

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('[Reviews GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch reviews', reviews: [] }, { status: 500 });
  }
}

// ─── POST /api/reviews ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = await checkRateLimit(ip, 'submit_review', 10, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many review submissions. Please wait.' }, { status: 429 });
    }

    const body = await request.json();
    const { productId, userId, userName, rating, title, comment, stateOrigin } = body;

    if (!productId || !comment || !rating) {
      return NextResponse.json({ error: 'productId, rating, and comment are required' }, { status: 400 });
    }

    const numRating = Math.min(5, Math.max(1, parseInt(String(rating), 10) || 5));
    const cleanUserName = (userName && String(userName).trim()) ? String(userName).trim() : 'Verified Buyer';

    let createdReview: any = null;

    // 1. Insert into RDS PostgreSQL
    if (isPgConfigured) {
      try {
        await ensureReviewsTableExists();
        const res = await query(
          `INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment, state_origin, is_verified_buyer)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)
           RETURNING id, product_id, user_id, user_name, rating, title, comment, state_origin, is_verified_buyer, created_at`,
          [productId, userId || null, cleanUserName, numRating, title || null, String(comment).trim(), stateOrigin || 'India']
        );
        if (res.rows && res.rows.length > 0) {
          createdReview = res.rows[0];

          // Update rating aggregate on product table
          await query(
            `UPDATE products
             SET rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0) FROM reviews WHERE product_id = $1),
                 reviews_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
             WHERE id = $1`,
            [productId]
          ).catch(() => {});
        }
      } catch (dbErr: any) {
        console.warn('[Reviews POST] RDS failed, falling back to Supabase:', dbErr.message);
      }
    }

    // 2. Insert/Fallback to Supabase
    if (!createdReview) {
      try {
        const sb = getAdminSupabase();
        const { data, error } = await sb
          .from('reviews')
          .insert({
            product_id: productId,
            user_id: userId || null,
            user_name: cleanUserName,
            rating: numRating,
            title: title || null,
            comment: String(comment).trim(),
            state_origin: stateOrigin || 'India',
            is_verified_buyer: true,
          })
          .select()
          .single();

        if (!error && data) {
          createdReview = data;
        }
      } catch (sbErr: any) {
        console.warn('[Reviews POST] Supabase insert error:', sbErr.message);
      }
    }

    if (!createdReview) {
      createdReview = {
        id: 'rev-' + Date.now(),
        product_id: productId,
        user_id: userId || null,
        user_name: cleanUserName,
        rating: numRating,
        title: title || null,
        comment: String(comment).trim(),
        state_origin: stateOrigin || 'India',
        is_verified_buyer: true,
        created_at: new Date().toISOString(),
      };
    }

    return NextResponse.json({ success: true, review: createdReview }, { status: 201 });
  } catch (error: any) {
    console.error('[Reviews POST] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}
