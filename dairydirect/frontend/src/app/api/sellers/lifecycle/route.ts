/**
 * POST /api/sellers/lifecycle
 * 
 * Admin-only API for managing seller lifecycle transitions.
 * Handles: under_review, temporary review, deactivation, 
 * permanent deactivation, reactivation approval/rejection.
 * 
 * All operations are validated server-side with proper authorization,
 * status transition checks, audit logging, and notification creation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { requireAdmin, getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { writeAuditLog } from '@/lib/security/audit';
import { invalidateSellerProfileCache } from '@/lib/aws/redis';

export const dynamic = 'force-dynamic';

// ─── Valid seller status transitions ────────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  'active':                    ['under_review'],
  'under_review':              ['active', 'deactivated', 'permanently_deactivated'],
  'deactivated':               ['reactivation_requested'],
  'reactivation_requested':    ['active', 'deactivated'],
  // These are terminal or special states with no forward transitions:
  'permanently_deactivated':   [],
  'pending':                   ['active', 'rejected'],
  'pending_kyc':               ['active', 'rejected'],
  'pending_inquiry':           ['active', 'rejected'],
  'suspended':                 ['active', 'under_review'],
  'rejected':                  [],
};

// ─── Reason options for status changes ──────────────────────────────────────
const REVIEW_REASONS = [
  'Customer complaints',
  'Quality concerns',
  'Policy violation investigation',
  'Compliance review',
  'Financial irregularities',
  'Product quality issues',
  'Delivery issues',
  'Other',
];

const DEACTIVATION_REASONS = [
  'Repeated policy violations',
  'Fraudulent activity',
  'Poor product quality',
  'Customer safety concerns',
  'Non-compliance with regulations',
  'Failure to meet standards after review',
  'Other',
];

// ─── GET: Fetch seller lifecycle data ───────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const action = searchParams.get('action');

    // Get lifecycle metadata (reasons, transitions) - accessible to all authenticated users
    if (action === 'metadata') {
      return NextResponse.json({
        reviewReasons: REVIEW_REASONS,
        deactivationReasons: DEACTIVATION_REASONS,
        validTransitions: VALID_TRANSITIONS,
      });
    }

    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sb = getAdminSupabase();

    // Verify access rights: admin can view all; sellers can only view their own store data
    if (action === 'list') {
      if (!auth.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
      }
    } else if (sellerId) {
      if (!auth.isAdmin) {
        const { data: storeCheck } = await sb.from('sellers').select('user_id').eq('id', sellerId).maybeSingle();
        if (!storeCheck || storeCheck.user_id !== auth.userId) {
          return NextResponse.json({ error: 'Forbidden: Access denied to other store details' }, { status: 403 });
        }
      }
    }

    // Get seller status history
    if (action === 'history' && sellerId) {
      const { data: history, error } = await sb
        .from('seller_status_history')
        .select('*, profiles:changed_by(name, email)')
        .eq('seller_id', sellerId)
        .order('changed_at', { ascending: false })
        .limit(50);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ history: history || [] });
    }

    // Get active temporary review for a seller
    if (action === 'active_review' && sellerId) {
      const { data: reviews, error } = await sb
        .from('seller_status_history')
        .select('*')
        .eq('seller_id', sellerId)
        .in('action', ['temporary_review_started', 'temporary_review_extended'])
        .order('changed_at', { ascending: false })
        .limit(1);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Check if the review is still "active" (not ended, and seller is still under_review)
      const { data: seller } = await sb
        .from('sellers')
        .select('status')
        .eq('id', sellerId)
        .single();

      let activeReview = null;
      if (reviews && reviews.length > 0 && seller?.status === 'under_review') {
        const latestReview = reviews[0];
        // Check if there's a more recent "end" action
        const { data: endActions } = await sb
          .from('seller_status_history')
          .select('id')
          .eq('seller_id', sellerId)
          .eq('action', 'temporary_review_ended')
          .gt('changed_at', latestReview.changed_at)
          .limit(1);

        if (!endActions || endActions.length === 0) {
          activeReview = latestReview;
        }
      }

      return NextResponse.json({ activeReview });
    }

    // Get all sellers with their status for admin list
    if (action === 'list') {
      const status = searchParams.get('status');
      let query = sb
        .from('sellers')
        .select('*, profiles:user_id(name, email, phone, avatar_url)')
        .order('updated_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: sellers, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ sellers: sellers || [] });
    }

    // Get single seller details (with active review info)
    if (sellerId) {
      const { data: seller, error } = await sb
        .from('sellers')
        .select('*, profiles:user_id(name, email, phone, avatar_url)')
        .eq('id', sellerId)
        .single();

      if (error || !seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
      }

      // Get active review
      let activeReview = null;
      if (seller.status === 'under_review') {
        const { data: reviews } = await sb
          .from('seller_status_history')
          .select('*')
          .eq('seller_id', sellerId)
          .in('action', ['temporary_review_started', 'temporary_review_extended'])
          .order('changed_at', { ascending: false })
          .limit(1);

        if (reviews && reviews.length > 0) {
          const latestReview = reviews[0];
          const { data: endActions } = await sb
            .from('seller_status_history')
            .select('id')
            .eq('seller_id', sellerId)
            .eq('action', 'temporary_review_ended')
            .gt('changed_at', latestReview.changed_at)
            .limit(1);

          if (!endActions || endActions.length === 0) {
            activeReview = latestReview;
          }
        }
      }

      // Get recent history
      const { data: history } = await sb
        .from('seller_status_history')
        .select('*, profiles:changed_by(name, email)')
        .eq('seller_id', sellerId)
        .order('changed_at', { ascending: false })
        .limit(20);

      return NextResponse.json({
        seller,
        activeReview,
        history: history || [],
      });
    }

    return NextResponse.json({ error: 'Missing sellerId or action parameter' }, { status: 400 });
  } catch (err: any) {
    console.error('[SellerLifecycle GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ─── POST: Execute seller lifecycle transitions ─────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { sellerId, action, reason, notes, duration, customStartDate, customEndDate } = body;

    if (!sellerId || !action) {
      return NextResponse.json({ error: 'sellerId and action are required' }, { status: 400 });
    }

    const sb = getAdminSupabase();
    const ipAddress = getClientIP(request);

    // Fetch current seller
    const { data: seller, error: sellerError } = await sb
      .from('sellers')
      .select('*')
      .eq('id', sellerId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const currentStatus = seller.status;

    // ─── Handle each action ──────────────────────────────────────────────────

    switch (action) {
      // ── Put seller under review ────────────────────────────────────────────
      case 'put_under_review': {
        if (!VALID_TRANSITIONS[currentStatus]?.includes('under_review')) {
          return NextResponse.json({
            error: `Cannot put seller under review from current status: ${currentStatus}`,
          }, { status: 400 });
        }

        if (!reason) {
          return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
        }

        // Update seller status and review tracking
        const { error: updateError } = await sb
          .from('sellers')
          .update({
            status: 'under_review',
            review_started_at: new Date().toISOString(),
            review_reason: reason,
          })
          .eq('id', sellerId);

        if (updateError) throw updateError;

        // Create history record
        await sb.from('seller_status_history').insert({
          seller_id: sellerId,
          previous_status: currentStatus,
          new_status: 'under_review',
          action: 'seller_put_under_review',
          reason,
          notes: notes || null,
          changed_by: admin.userId,
        });

        // Create notification for seller
        if (seller.user_id) {
          await sb.from('notifications').insert({
            user_id: seller.user_id,
            role_target: 'seller',
            title: 'Account Under Review',
            message: `Your seller account "${seller.store_name}" has been placed under review. Reason: ${reason}. Our team will review your account and notify you of the outcome.`,
            type: 'system',
            related_id: sellerId,
          });
        }

        // Audit log
        await writeAuditLog({
          adminId: admin.userId,
          action: 'seller.put_under_review',
          resourceType: 'seller',
          resourceId: sellerId,
          details: { previous_status: currentStatus, new_status: 'under_review', reason, notes },
          ipAddress,
        });

        // Invalidate cache
        if (seller.user_id) {
          await invalidateSellerProfileCache(seller.user_id).catch(() => {});
        }

        return NextResponse.json({
          success: true,
          message: 'Seller placed under review',
          seller: { ...seller, status: 'under_review' },
        });
      }

      // ── Keep Active (restore from under_review) ────────────────────────────
      case 'keep_active': {
        if (currentStatus !== 'under_review') {
          return NextResponse.json({
            error: `Cannot activate seller from current status: ${currentStatus}`,
          }, { status: 400 });
        }

        const { error: updateError } = await sb
          .from('sellers')
          .update({
            status: 'active',
            review_started_at: null,
            review_expires_at: null,
            review_reason: null,
            deactivation_reason: null,
            reactivation_reason: null,
          })
          .eq('id', sellerId);

        if (updateError) throw updateError;

        await sb.from('seller_status_history').insert({
          seller_id: sellerId,
          previous_status: currentStatus,
          new_status: 'active',
          action: 'seller_kept_active',
          reason: reason || 'Review completed - no issues found',
          notes: notes || null,
          changed_by: admin.userId,
        });

        if (seller.user_id) {
          await sb.from('notifications').insert({
            user_id: seller.user_id,
            role_target: 'seller',
            title: 'Account Reactivated',
            message: `Great news! Your seller account "${seller.store_name}" review is complete. Your account is now active again.`,
            type: 'system',
            related_id: sellerId,
          });
        }

        await writeAuditLog({
          adminId: admin.userId,
          action: 'seller.kept_active',
          resourceType: 'seller',
          resourceId: sellerId,
          details: { previous_status: currentStatus, new_status: 'active', reason, notes },
          ipAddress,
        });

        if (seller.user_id) {
          await invalidateSellerProfileCache(seller.user_id).catch(() => {});
        }

        return NextResponse.json({
          success: true,
          message: 'Seller account activated',
          seller: { ...seller, status: 'active' },
        });
      }

      // ── Start temporary review period ──────────────────────────────────────
      case 'start_temporary_review': {
        if (currentStatus !== 'under_review') {
          return NextResponse.json({
            error: 'Seller must be under_review to start a temporary review period',
          }, { status: 400 });
        }

        if (!reason) {
          return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
        }

        let reviewStartedAt: Date;
        let reviewExpiresAt: Date;

        if (duration === 'custom') {
          if (!customStartDate || !customEndDate) {
            return NextResponse.json({ error: 'Custom start and end dates are required' }, { status: 400 });
          }
          reviewStartedAt = new Date(customStartDate);
          reviewExpiresAt = new Date(customEndDate);

          if (reviewExpiresAt <= reviewStartedAt) {
            return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
          }
        } else {
          const durationDays = parseInt(duration);
          if (isNaN(durationDays) || durationDays < 1 || durationDays > 365) {
            return NextResponse.json({ error: 'Invalid duration. Must be between 1 and 365 days.' }, { status: 400 });
          }
          reviewStartedAt = new Date();
          reviewExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        }

        // Update seller review columns
        await sb
          .from('sellers')
          .update({
            review_started_at: reviewStartedAt.toISOString(),
            review_expires_at: reviewExpiresAt.toISOString(),
            review_reason: reason,
          })
          .eq('id', sellerId);

        // Seller stays under_review (no status change)
        await sb.from('seller_status_history').insert({
          seller_id: sellerId,
          previous_status: 'under_review',
          new_status: 'under_review',
          action: 'temporary_review_started',
          reason,
          notes: notes || null,
          review_started_at: reviewStartedAt.toISOString(),
          review_expires_at: reviewExpiresAt.toISOString(),
          changed_by: admin.userId,
          metadata: { duration_days: duration === 'custom' ? 'custom' : parseInt(duration) },
        });

        if (seller.user_id) {
          await sb.from('notifications').insert({
            user_id: seller.user_id,
            role_target: 'seller',
            title: 'Temporary Review Period Started',
            message: `A temporary review period has been set for your account "${seller.store_name}". The review period expires on ${reviewExpiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
            type: 'system',
            related_id: sellerId,
          });
        }

        await writeAuditLog({
          adminId: admin.userId,
          action: 'seller.temporary_review_started',
          resourceType: 'seller',
          resourceId: sellerId,
          details: {
            review_started_at: reviewStartedAt.toISOString(),
            review_expires_at: reviewExpiresAt.toISOString(),
            reason,
            notes,
            duration,
          },
          ipAddress,
        });

        return NextResponse.json({
          success: true,
          message: 'Temporary review period started',
          review: {
            review_started_at: reviewStartedAt.toISOString(),
            review_expires_at: reviewExpiresAt.toISOString(),
          },
        });
      }

      // ── Extend temporary review period ─────────────────────────────────────
      case 'extend_review': {
        if (currentStatus !== 'under_review') {
          return NextResponse.json({
            error: 'Seller must be under_review to extend review period',
          }, { status: 400 });
        }

        if (!duration && !customEndDate) {
          return NextResponse.json({ error: 'Duration or new end date is required' }, { status: 400 });
        }

        // Find the current active review
        const { data: activeReviews } = await sb
          .from('seller_status_history')
          .select('*')
          .eq('seller_id', sellerId)
          .in('action', ['temporary_review_started', 'temporary_review_extended'])
          .order('changed_at', { ascending: false })
          .limit(1);

        if (!activeReviews || activeReviews.length === 0) {
          return NextResponse.json({ error: 'No active temporary review found' }, { status: 400 });
        }

        const currentReview = activeReviews[0];
        const currentExpiry = new Date(currentReview.review_expires_at);
        let newExpiresAt: Date;

        if (customEndDate) {
          newExpiresAt = new Date(customEndDate);
        } else {
          const extensionDays = parseInt(duration);
          if (isNaN(extensionDays) || extensionDays < 1) {
            return NextResponse.json({ error: 'Invalid extension duration' }, { status: 400 });
          }
          newExpiresAt = new Date(currentExpiry.getTime() + extensionDays * 24 * 60 * 60 * 1000);
        }

        // Update seller review expiry
        await sb
          .from('sellers')
          .update({ review_expires_at: newExpiresAt.toISOString() })
          .eq('id', sellerId);

        await sb.from('seller_status_history').insert({
          seller_id: sellerId,
          previous_status: 'under_review',
          new_status: 'under_review',
          action: 'temporary_review_extended',
          reason: reason || 'Review period extended',
          notes: notes || null,
          review_started_at: currentReview.review_started_at,
          review_expires_at: newExpiresAt.toISOString(),
          changed_by: admin.userId,
          metadata: {
            previous_expiry: currentExpiry.toISOString(),
            extension_days: duration === 'custom' ? 'custom' : parseInt(duration || '0'),
          },
        });

        if (seller.user_id) {
          await sb.from('notifications').insert({
            user_id: seller.user_id,
            role_target: 'seller',
            title: 'Review Period Extended',
            message: `The review period for your account "${seller.store_name}" has been extended until ${newExpiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
            type: 'system',
            related_id: sellerId,
          });
        }

        await writeAuditLog({
          adminId: admin.userId,
          action: 'seller.temporary_review_extended',
          resourceType: 'seller',
          resourceId: sellerId,
          details: {
            previous_expiry: currentExpiry.toISOString(),
            new_expiry: newExpiresAt.toISOString(),
            reason,
            notes,
          },
          ipAddress,
        });

        return NextResponse.json({
          success: true,
          message: 'Review period extended',
          review: {
            review_started_at: currentReview.review_started_at,
            review_expires_at: newExpiresAt.toISOString(),
          },
        });
      }

      // ── End temporary review early ─────────────────────────────────────────
      case 'end_review': {
        if (currentStatus !== 'under_review') {
          return NextResponse.json({
            error: 'Seller must be under_review to end review period',
          }, { status: 400 });
        }

        // Clear review expiry on sellers table while staying under review
        await sb
          .from('sellers')
          .update({ review_expires_at: null })
          .eq('id', sellerId);

        await sb.from('seller_status_history').insert({
          seller_id: sellerId,
          previous_status: 'under_review',
          new_status: 'under_review',
          action: 'temporary_review_ended',
          reason: reason || 'Review period ended by admin',
          notes: notes || null,
          changed_by: admin.userId,
        });

        await writeAuditLog({
          adminId: admin.userId,
          action: 'seller.temporary_review_ended',
          resourceType: 'seller',
          resourceId: sellerId,
          details: { reason, notes },
          ipAddress,
        });

        return NextResponse.json({
          success: true,
          message: 'Temporary review period ended. Seller remains under review pending your decision.',
        });
      }

      // ── Deactivate seller ──────────────────────────────────────────────────
      case 'deactivate': {
        if (!['under_review', 'active', 'suspended'].includes(currentStatus)) {
          return NextResponse.json({
            error: `Cannot deactivate seller from current status: ${currentStatus}`,
          }, { status: 400 });
        }

        if (!reason) {
          return NextResponse.json({ error: 'Reason is required for deactivation' }, { status: 400 });
        }

        const { error: updateError } = await sb
          .from('sellers')
          .update({
            status: 'deactivated',
            deactivation_reason: reason,
            review_expires_at: null,
          })
          .eq('id', sellerId);

        if (updateError) throw updateError;

        await sb.from('seller_status_history').insert({
          seller_id: sellerId,
          previous_status: currentStatus,
          new_status: 'deactivated',
          action: 'seller_deactivated',
          reason,
          notes: notes || null,
          changed_by: admin.userId,
        });

        if (seller.user_id) {
          await sb.from('notifications').insert({
            user_id: seller.user_id,
            role_target: 'seller',
            title: 'Account Deactivated',
            message: `Your seller account "${seller.store_name}" has been deactivated. Reason: ${reason}. You may request reactivation from your seller dashboard.`,
            type: 'system',
            related_id: sellerId,
          });
        }

        await writeAuditLog({
          adminId: admin.userId,
          action: 'seller.deactivated',
          resourceType: 'seller',
          resourceId: sellerId,
          details: { previous_status: currentStatus, new_status: 'deactivated', reason, notes },
          ipAddress,
        });

        if (seller.user_id) {
          await invalidateSellerProfileCache(seller.user_id).catch(() => {});
        }

        return NextResponse.json({
          success: true,
          message: 'Seller deactivated',
          seller: { ...seller, status: 'deactivated' },
        });
      }

      // ── Permanently deactivate seller ──────────────────────────────────────
      case 'permanently_deactivate': {
        if (!['under_review', 'deactivated', 'active', 'suspended'].includes(currentStatus)) {
          return NextResponse.json({
            error: `Cannot permanently deactivate seller from current status: ${currentStatus}`,
          }, { status: 400 });
        }

        if (!reason) {
          return NextResponse.json({ error: 'Reason is required for permanent deactivation' }, { status: 400 });
        }

        const { error: updateError } = await sb
          .from('sellers')
          .update({
            status: 'permanently_deactivated',
            deactivation_reason: reason,
            review_expires_at: null,
          })
          .eq('id', sellerId);

        if (updateError) throw updateError;

        await sb.from('seller_status_history').insert({
          seller_id: sellerId,
          previous_status: currentStatus,
          new_status: 'permanently_deactivated',
          action: 'seller_permanently_deactivated',
          reason,
          notes: notes || null,
          changed_by: admin.userId,
        });

        if (seller.user_id) {
          await sb.from('notifications').insert({
            user_id: seller.user_id,
            role_target: 'seller',
            title: 'Account Permanently Deactivated',
            message: `Your seller account "${seller.store_name}" has been permanently deactivated. Reason: ${reason}. This action cannot be reversed.`,
            type: 'system',
            related_id: sellerId,
          });
        }

        await writeAuditLog({
          adminId: admin.userId,
          action: 'seller.permanently_deactivated',
          resourceType: 'seller',
          resourceId: sellerId,
          details: { previous_status: currentStatus, new_status: 'permanently_deactivated', reason, notes },
          ipAddress,
        });

        if (seller.user_id) {
          await invalidateSellerProfileCache(seller.user_id).catch(() => {});
        }

        return NextResponse.json({
          success: true,
          message: 'Seller permanently deactivated',
          seller: { ...seller, status: 'permanently_deactivated' },
        });
      }

      // ── Approve reactivation request ───────────────────────────────────────
      case 'approve_reactivation': {
        if (currentStatus !== 'reactivation_requested') {
          return NextResponse.json({
            error: 'Seller must have requested reactivation',
          }, { status: 400 });
        }

        const { error: updateError } = await sb
          .from('sellers')
          .update({
            status: 'active',
            deactivation_reason: null,
            reactivation_reason: null,
            review_expires_at: null,
            review_reason: null,
          })
          .eq('id', sellerId);

        if (updateError) throw updateError;

        await sb.from('seller_status_history').insert({
          seller_id: sellerId,
          previous_status: 'reactivation_requested',
          new_status: 'active',
          action: 'reactivation_approved',
          reason: reason || 'Reactivation approved by admin',
          notes: notes || null,
          changed_by: admin.userId,
        });

        if (seller.user_id) {
          await sb.from('notifications').insert({
            user_id: seller.user_id,
            role_target: 'seller',
            title: 'Reactivation Approved!',
            message: `Your seller account "${seller.store_name}" has been reactivated. You can now manage your products and receive orders.`,
            type: 'system',
            related_id: sellerId,
          });
        }

        await writeAuditLog({
          adminId: admin.userId,
          action: 'seller.reactivation_approved',
          resourceType: 'seller',
          resourceId: sellerId,
          details: { previous_status: 'reactivation_requested', new_status: 'active', reason, notes },
          ipAddress,
        });

        if (seller.user_id) {
          await invalidateSellerProfileCache(seller.user_id).catch(() => {});
        }

        return NextResponse.json({
          success: true,
          message: 'Reactivation approved',
          seller: { ...seller, status: 'active' },
        });
      }

      // ── Reject reactivation request ────────────────────────────────────────
      case 'reject_reactivation': {
        if (currentStatus !== 'reactivation_requested') {
          return NextResponse.json({
            error: 'Seller must have requested reactivation',
          }, { status: 400 });
        }

        if (!reason) {
          return NextResponse.json({ error: 'Reason is required for rejection' }, { status: 400 });
        }

        const { error: updateError } = await sb
          .from('sellers')
          .update({
            status: 'deactivated',
            deactivation_reason: reason,
          })
          .eq('id', sellerId);

        if (updateError) throw updateError;

        await sb.from('seller_status_history').insert({
          seller_id: sellerId,
          previous_status: 'reactivation_requested',
          new_status: 'deactivated',
          action: 'reactivation_rejected',
          reason,
          notes: notes || null,
          changed_by: admin.userId,
        });

        if (seller.user_id) {
          await sb.from('notifications').insert({
            user_id: seller.user_id,
            role_target: 'seller',
            title: 'Reactivation Request Rejected',
            message: `Your reactivation request for "${seller.store_name}" has been rejected. Reason: ${reason}.`,
            type: 'system',
            related_id: sellerId,
          });
        }

        await writeAuditLog({
          adminId: admin.userId,
          action: 'seller.reactivation_rejected',
          resourceType: 'seller',
          resourceId: sellerId,
          details: { previous_status: 'reactivation_requested', new_status: 'deactivated', reason, notes },
          ipAddress,
        });

        if (seller.user_id) {
          await invalidateSellerProfileCache(seller.user_id).catch(() => {});
        }

        return NextResponse.json({
          success: true,
          message: 'Reactivation rejected',
          seller: { ...seller, status: 'deactivated' },
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[SellerLifecycle POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
