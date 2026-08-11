export interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  user_name: string;
  rating: number;
  title: string | null;
  comment: string;
  state_origin: string;
  is_verified_buyer: boolean;
  helpful_count: number;
  created_at: string;
}
