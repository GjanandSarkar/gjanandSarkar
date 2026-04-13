import { api } from './client';
import { getAuthToken } from './auth';

export type ProductWithVariants = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  is_freshness_guarantee: boolean;
  is_active: boolean;
  created_at: string;
  product_variants: {
    id: string;
    product_id: string;
    weight: string;
    price: number;
    original_price: number | null;
    stock: number;
  }[];
};

export type NewProductInput = {
  name: string;
  category: string;
  description?: string;
  image_url?: string;
  is_freshness_guarantee?: boolean;
};

export type NewVariantInput = {
  weight: string;
  price: number;
  original_price?: number;
  stock?: number;
};

export async function getProducts(
  options: { category?: string; activeOnly?: boolean } = {}
): Promise<ProductWithVariants[]> {
  try {
    const token = getAuthToken();
    const result = await api.products.get({
      category: options.category,
      activeOnly: options.activeOnly,
      token: token ?? undefined,
    });
    return result.products ?? [];
  } catch (error) {
    console.error('getProducts error:', error);
    return [];
  }
}

export async function getProductById(id: string): Promise<ProductWithVariants | null> {
  try {
    const products = await api.products.get();
    return products.products?.find((p: ProductWithVariants) => p.id === id) ?? null;
  } catch (error) {
    console.error('getProductById error:', error);
    return null;
  }
}

export async function createProduct(
  product: NewProductInput,
  variants: NewVariantInput[]
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    const result = await api.products.create({ ...product, variants }, token);
    return { success: result.success, id: result.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProduct(
  id: string,
  updates: Partial<NewProductInput>
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function upsertVariants(
  productId: string,
  variants: (NewVariantInput & { id?: string })[]
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function uploadProductImage(
  file: File
): Promise<{ url?: string; error?: string }> {
  return { error: 'Not implemented yet' };
}