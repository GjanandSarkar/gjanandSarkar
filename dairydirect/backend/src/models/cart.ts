export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product_name?: string;
  category?: string;
  image_url?: string;
  variant_weight?: string;
  price?: number;
  stock?: number;
}
