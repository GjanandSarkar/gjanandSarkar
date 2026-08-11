export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'refunded';

export interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  description: string | null;
  images: string[];
  status: ReturnStatus;
  refund_amount: number;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  order_number?: string;
  user_name?: string;
  user_phone?: string;
}
