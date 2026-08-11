export type ProductCategory =
  | 'Milk'
  | 'Ghee'
  | 'Paneer'
  | 'Curd'
  | 'Buttermilk'
  | 'Butter'
  | 'Sweets'
  | 'Other';

export interface ProductVariant {
  id: string;
  product_id: string;
  weight: string;
  price: number;
  original_price: number | null;
  cost_price: number;
  stock: number;
  low_stock_threshold: number;
  batch_number: string | null;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string | null;
  image_url: string | null;
  s3_image_key: string | null;
  is_freshness_guarantee: boolean;
  is_active: boolean;
  seller_id: string | null;
  state_origin: string;
  brand: string;
  rating: number;
  reviews_count: number;
  is_deal_of_the_day: boolean;
  discount_pct: number;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
}
