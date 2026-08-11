export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  address: string;
  apartment: string | null;
  pincode: string | null;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
