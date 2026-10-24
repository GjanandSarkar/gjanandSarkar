import { supabaseAdmin } from '@/lib/supabase/admin';

const isUuid = (v?: string): boolean =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function findRefund(rf: { id: string; receipt?: string }) {
  const { data } = await supabaseAdmin
    .from('refunds')
    .select('*')
    .eq('razorpay_refund_id', rf.id)
    .maybeSingle();

  if (data) return data;

  if (isUuid(rf.receipt)) {
    // If webhook arrives before the razorpay_refund_id was saved to DB, match by row receipt UUID
    const { data: byReceipt } = await supabaseAdmin
      .from('refunds')
      .select('*')
      .eq('id', rf.receipt!)
      .maybeSingle();
    return byReceipt;
  }

  return null;
}
