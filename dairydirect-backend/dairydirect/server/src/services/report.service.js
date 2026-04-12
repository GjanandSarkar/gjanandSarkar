// src/services/report.service.js — Quality Report Business Logic

import { supabase, cc, dbError } from '../utils/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const REPORT_SELECT = `
  id, issue_type, description, image_url, status, resolution,
  resolved_at, created_at, updated_at,
  orders!order_id(
    id, status, total_amount, created_at,
    order_items(
      quantity,
      products!product_id(name),
      product_variants!variant_id(label)
    )
  )
`;

/**
 * Customer: File a quality report against a delivered order
 */
export const createReport = async (userId, data) => {
  const { orderId, issueType, description, imageUrl } = data;

  // Verify order exists and belongs to user
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, status, quality_reports!order_id(id)')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (orderErr || !order) throw new ApiError(404, 'Order not found');

  if (order.status !== 'DELIVERED') {
    throw new ApiError(
      400,
      `Quality reports can only be filed for delivered orders. Current status: ${order.status}`
    );
  }

  if (order.quality_reports?.length > 0) {
    throw new ApiError(
      409,
      'A quality report has already been filed for this order. Contact support for further assistance.'
    );
  }

  const { data: report, error } = await supabase
    .from('quality_reports')
    .insert({
      order_id: orderId,
      user_id: userId,
      issue_type: issueType,
      description,
      image_url: imageUrl || null,
    })
    .select(REPORT_SELECT)
    .single();

  dbError(error, 'Failed to create quality report');
  return cc(report);
};

/**
 * Customer: Get their own reports
 */
export const getMyReports = async (userId) => {
  const { data, error } = await supabase
    .from('quality_reports')
    .select(REPORT_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  dbError(error, 'Failed to fetch reports');
  return cc(data || []);
};

/**
 * Admin: Get all reports with optional status filter + pagination
 */
export const getAllReports = async ({ status, page = 1, limit = 20 } = {}) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('quality_reports')
    .select(
      REPORT_SELECT + ', users!user_id(id, name, phone)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(skip, skip + parseInt(limit) - 1);

  if (status) query = query.eq('status', status);

  const { data: reports, error, count } = await query;
  dbError(error, 'Failed to fetch reports');

  return {
    reports: cc(reports || []),
    total: count || 0,
    page: parseInt(page),
    limit: parseInt(limit),
  };
};

/**
 * Admin: Update report status and add resolution note
 */
export const updateReport = async (reportId, { status, resolution }) => {
  const { data: existing, error: findErr } = await supabase
    .from('quality_reports')
    .select('id')
    .eq('id', reportId)
    .single();

  if (findErr || !existing) throw new ApiError(404, 'Report not found');

  const updateData = {};
  if (status) updateData.status = status;
  if (resolution) updateData.resolution = resolution;
  if (status === 'RESOLVED') updateData.resolved_at = new Date().toISOString();

  const { data: report, error } = await supabase
    .from('quality_reports')
    .update(updateData)
    .eq('id', reportId)
    .select('id, status, resolution, resolved_at, updated_at')
    .single();

  dbError(error, 'Failed to update report');
  return cc(report);
};
