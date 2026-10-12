import { api } from './client';
import { getSupabaseLazy } from '@/lib/supabase/lazy';
import { uploadImageToImageKit } from './imagekit';

export type ProductWithVariants = {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  description: string | null;
  brand?: string | null;
  image_url: string | null;
  gallery_images?: string[];
  is_freshness_guarantee: boolean;
  is_active: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  sku?: string | null;
  tax_rate?: number;
  shipping_details?: string | null;
  return_policy?: string | null;
  attributes?: Record<string, any>;
  compliance_documents?: any[];
  created_at: string;
  updated_at?: string;
  seller_id?: string | null;
  created_by?: string | null;
  sellers?: {
    id: string;
    store_name: string;
    status: string;
    category?: string;
  } | null;
  product_variants: {
    id: string;
    product_id?: string;
    weight: string;
    price: number;
    original_price: number | null;
    cost_price?: number;
    stock: number;
    reserved_quantity?: number;
    available_quantity?: number;
    low_stock_threshold?: number;
  }[];
};

export type NewProductInput = {
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  brand?: string;
  image_url?: string;
  gallery_images?: string[];
  is_freshness_guarantee?: boolean;
  sku?: string;
  tax_rate?: number;
  shipping_details?: string;
  return_policy?: string;
  attributes?: Record<string, any>;
  compliance_documents?: any[];
  sellerId?: string;
};

export type NewVariantInput = {
  weight: string;
  price: number;
  original_price?: number;
  stock?: number;
  cost_price?: number;
};

export async function getProducts(
  options: { category?: string; activeOnly?: boolean; sellerId?: string; q?: string } = {}
): Promise<ProductWithVariants[]> {
  try {
    const params = new URLSearchParams();
    if (options.category) params.set('category', options.category);
    if (options.activeOnly !== undefined) params.set('activeOnly', String(options.activeOnly));
    if (options.sellerId) params.set('sellerId', options.sellerId);
    if (options.q) params.set('q', options.q);

    const res = await fetch(`/api/products?${params.toString()}`, { next: { revalidate: 60, tags: ['products', 'inventory'] } });
    if (res.ok) {
      const data = await res.json();
      return data.products ?? [];
    }

    const result = await api.products.get({
      category: options.category,
      activeOnly: options.activeOnly,
    });
    return result.products ?? [];
  } catch (error) {
    console.error('getProducts error:', error);
    return [];
  }
}


export async function getProductById(id: string): Promise<ProductWithVariants | null> {
  try {
    const result = await api.products.getById(id);
    if (result.product) return result.product;
    const all = await api.products.get({ activeOnly: false });
    return all.products?.find((p: ProductWithVariants) => p.id === id) ?? null;
  } catch (error) {
    console.error('getProductById error:', error);
    try {
      const all = await api.products.get({ activeOnly: false });
      return all.products?.find((p: ProductWithVariants) => p.id === id) ?? null;
    } catch {
      return null;
    }
  }
}


export async function createProduct(
  product: NewProductInput,
  variants: NewVariantInput[]
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const result = await api.products.create({ ...product, variants });
    return { success: result.success, id: result.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProduct(
  id: string,
  updates: Partial<NewProductInput> & {
    is_active?: boolean;
    variants?: (NewVariantInput & { id?: string })[];
  }
): Promise<{ success: boolean; product?: ProductWithVariants; error?: string }> {
  try {
    const result = await api.products.update(id, updates);
    return { success: result.success, product: result.product };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(
  id: string,
  permanent: boolean = false
): Promise<{ success: boolean; softDeleted?: boolean; permanent?: boolean; message?: string; error?: string }> {
  try {
    const result = await api.products.delete(id, permanent);
    return {
      success: result.success,
      softDeleted: result.softDeleted,
      permanent: result.permanent,
      message: result.message,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function uploadProductImage(
  file: File
): Promise<{ url?: string; error?: string }> {
  try {
    // 1. Try ImageKit upload first (stores images on ImageKit CDN in /products folder)
    const ikRes = await uploadImageToImageKit(file, '/products');
    if (ikRes.success && ikRes.url) {
      return { url: ikRes.url };
    }

    // 2. Fallback to Supabase Storage if ImageKit keys are not configured
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const supabase = await getSupabaseLazy();
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return { url: data.publicUrl };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function uploadMultipleProductImages(
  files: File[]
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];
  for (const file of files) {
    const res = await uploadProductImage(file);
    if (res.url) {
      urls.push(res.url);
    } else if (res.error) {
      errors.push(`${file.name}: ${res.error}`);
    }
  }
  return { urls, errors };
}

/**
 * Fetch product approvals queue for Admin
 */
export async function getAdminProductApprovals(options: { status?: string; search?: string } = {}) {
  try {
    const { getAuthToken } = await import('@/lib/api/client');
    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.search) params.set('search', options.search);

    const res = await fetch(`/api/admin/product-approvals?${params.toString()}`, {
      cache: 'no-store',
      headers,
      credentials: 'include',
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Failed to fetch product approvals (${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    console.error('getAdminProductApprovals error:', err);
    return { success: false, error: err.message, products: [], counts: { pending: 0, approved: 0, rejected: 0, suspended: 0, all: 0 } };
  }
}

/**
 * Update product approval status (Approve, Reject, Suspend) for Admin
 */
export async function updateAdminProductApproval(id: string, status: string, rejectionReason?: string, notes?: string) {
  const { getAuthToken } = await import('@/lib/api/client');
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/admin/product-approvals', {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify({ id, status, rejectionReason, notes }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to update product approval status');
  }

  return await res.json();
}

/**
 * Submit new product for approval from Seller Dashboard
 */
export async function submitSellerProduct(payload: any) {
  const { getAuthToken } = await import('@/lib/api/client');
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/sellers/products', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to submit product');
  }

  return await res.json();
}

/**
 * Update existing seller product
 */
export async function updateSellerProduct(id: string, payload: any) {
  const { getAuthToken } = await import('@/lib/api/client');
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/sellers/products', {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify({ id, ...payload }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update product');
  }

  return await res.json();
}