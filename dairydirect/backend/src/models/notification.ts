export type NotificationType =
  | 'order'
  | 'promo'
  | 'subscription'
  | 'system'
  | 'return'
  | 'info';

export type RoleTarget = 'customer' | 'admin' | 'seller' | 'all';

export interface Notification {
  id: string;
  user_id: string | null;
  role_target: RoleTarget;
  title: string;
  message: string;
  type: NotificationType;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}
