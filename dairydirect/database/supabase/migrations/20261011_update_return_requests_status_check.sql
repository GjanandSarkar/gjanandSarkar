-- =============================================================================
-- Migration: Update return_requests status check constraint
-- Expands status to include operational return progression stages:
-- 'submitted', 'under_review', 'pending', 'approved', 'rejected',
-- 'return_in_progress', 'item_received', 'inspection_completed',
-- 'refund_pending', 'refunded'
-- =============================================================================

ALTER TABLE return_requests DROP CONSTRAINT IF EXISTS return_requests_status_check;
ALTER TABLE return_requests ADD CONSTRAINT return_requests_status_check 
  CHECK (status IN (
    'submitted', 
    'under_review', 
    'pending', 
    'approved', 
    'rejected', 
    'return_in_progress', 
    'item_received', 
    'inspection_completed', 
    'refund_pending', 
    'refunded'
  ));
