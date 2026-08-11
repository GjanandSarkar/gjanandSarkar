export interface DeliverySlot {
  id: string;
  slot_name: string;
  start_time: string;
  end_time: string;
  max_orders_capacity: number;
  is_active: boolean;
  created_at: string;
}
