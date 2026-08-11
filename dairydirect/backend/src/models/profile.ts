export type UserRole = 'customer' | 'admin' | 'seller';

export interface Profile {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  default_upi_id: string | null;
  loyalty_points: number;
  referral_code: string;
  referred_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
