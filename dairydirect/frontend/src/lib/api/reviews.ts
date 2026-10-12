import { supabase } from '@/lib/supabase';

export interface ReviewItem {
  id: string;
  product_id: string;
  user_id?: string;
  user_name: string;
  rating: number;
  title?: string;
  comment: string;
  state_origin?: string;
  is_verified_buyer: boolean;
  created_at: string;
}

export async function getProductReviews(productId: string): Promise<ReviewItem[]> {
  try {
    // 1. Try Backend API
    const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.reviews)) {
        return data.reviews;
      }
    }
  } catch (err) {
    console.warn('[getProductReviews] API fetch failed, falling back to Supabase:', err);
  }

  // 2. Direct Supabase Fallback
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data;
    }
  } catch (sbErr) {
    console.warn('[getProductReviews] Supabase fetch failed:', sbErr);
  }

  // Return empty array when no reviews exist in database
  return [];
}

export async function submitProductReview(payload: {
  productId: string;
  userId?: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  stateOrigin?: string;
}): Promise<{ success: boolean; review?: ReviewItem; error?: string }> {
  try {
    // 1. Try Backend API
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.review) {
        return { success: true, review: data.review };
      }
    }
  } catch (err) {
    console.warn('[submitProductReview] API failed, attempting direct Supabase:', err);
  }

  // 2. Direct Supabase Fallback
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        product_id: payload.productId,
        user_id: payload.userId || null,
        user_name: payload.userName,
        rating: payload.rating,
        title: payload.title || null,
        comment: payload.comment,
        state_origin: payload.stateOrigin || 'India',
        is_verified_buyer: true,
      })
      .select()
      .single();

    if (!error && data) {
      return { success: true, review: data };
    }
    if (error) {
      return { success: false, error: error.message };
    }
  } catch (sbErr: any) {
    return { success: false, error: sbErr.message || 'Failed to submit review' };
  }

  return { success: false, error: 'Failed to submit review' };
}
