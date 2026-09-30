import { api } from './client';
import { supabase } from '@/lib/supabase';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { uploadImageToImageKit } from './imagekit';

export type ProductWithVariants = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  is_freshness_guarantee: boolean;
  is_active: boolean;
  created_at: string;
  seller_id?: string | null;
  created_by?: string | null;
  product_variants: {
    id: string;
    product_id: string;
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
  description?: string;
  image_url?: string;
  is_freshness_guarantee?: boolean;
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

export async function getProductsServer(
  options: { category?: string; activeOnly?: boolean; q?: string; sellerId?: string } = {}
): Promise<ProductWithVariants[]> {
  try {
    const admin = getAdminSupabase();
    let query = admin
      .from('products')
      .select('*, product_variants(*)')
      .order('created_at', { ascending: false });

    if (options.category && options.category !== 'All' && options.category !== 'All Categories') {
      const cleanCat = options.category.replace(/-/g, ' ').trim();
      if (cleanCat.toLowerCase() === 'dairy & essentials' || cleanCat.toLowerCase() === 'dairy') {
        query = query.or('category.ilike.%Milk%,category.ilike.%Ghee%,category.ilike.%Paneer%,category.ilike.%Curd%,category.ilike.%Lassi%,category.ilike.%Dairy%');
      } else {
        query = query.ilike('category', `%${cleanCat}%`);
      }
    }

    if (options.activeOnly !== false) {
      query = query.eq('is_active', true);
    }

    if (options.q) {
      query = query.or(`name.ilike.%${options.q}%,description.ilike.%${options.q}%`);
    }

    if (options.sellerId) {
      query = query.or(`seller_id.eq.${options.sellerId},created_by.eq.${options.sellerId}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ProductWithVariants[];
  } catch (error) {
    console.error('getProductsServer error:', error);
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

export async function getProductByIdServer(id: string): Promise<ProductWithVariants | null> {
  try {
    const admin = getAdminSupabase();
    const { data, error } = await admin
      .from('products')
      .select(`
        *,
        product_variants (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as ProductWithVariants;
  } catch (error) {
    console.error('getProductByIdServer error:', error);
    return null;
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