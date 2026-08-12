import { supabase } from '@/lib/supabase';

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  image_url: string;
  is_active: boolean;
  display_order?: number;
  product_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  image_url: string;
  is_active?: boolean;
  display_order?: number;
}

export async function getCategories(options: { activeOnly?: boolean } = {}): Promise<Category[]> {
  try {
    const res = await fetch(`/api/categories?activeOnly=${options.activeOnly ? 'true' : 'false'}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.categories && Array.isArray(data.categories)) {
        return data.categories;
      }
    }
  } catch (err) {
    console.error('getCategories fetch error:', err);
  }

  // Live direct fallback to Supabase client
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    const { data, error } = await query;
    if (!error && data) {
      return data as Category[];
    }
  } catch (e) {
    // Return empty list if table does not exist or empty
  }

  return [];
}

export async function createCategory(input: CategoryInput): Promise<{ success: boolean; category?: Category; error?: string }> {
  try {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to create category' };
    }
    return { success: true, category: data.category };
  } catch (err: any) {
    console.error('createCategory error:', err);
    return { success: false, error: err.message || 'Network error creating category' };
  }
}

export async function updateCategory(id: string, updates: Partial<CategoryInput>): Promise<{ success: boolean; category?: Category; error?: string }> {
  try {
    const res = await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to update category' };
    }
    return { success: true, category: data.category };
  } catch (err: any) {
    console.error('updateCategory error:', err);
    return { success: false, error: err.message || 'Network error updating category' };
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to delete category' };
    }
    return { success: true };
  } catch (err: any) {
    console.error('deleteCategory error:', err);
    return { success: false, error: err.message || 'Network error deleting category' };
  }
}

export async function uploadCategoryImage(file: File): Promise<{ url?: string; error?: string }> {
  try {
    // 1. Upload to ImageKit via /api/upload/image in /admin/categories folder
    try {
      const { uploadImageToImageKit } = await import('./upload');
      const imageKitRes = await uploadImageToImageKit(file, {
        folder: '/admin/categories',
        role: 'admin',
        entityType: 'category',
        tags: ['category', 'admin'],
      });
      if (imageKitRes.url && !imageKitRes.error) {
        return { url: imageKitRes.url };
      }
    } catch (ikErr) {
      console.warn('[uploadCategoryImage] ImageKit upload error:', ikErr);
    }

    // 2. Supabase Storage fallback
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `category_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `admin/categories/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);
      if (data?.publicUrl) {
        return { url: data.publicUrl };
      }
    }

    // 3. Fallback to base64 Data URL for resilience
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ url: reader.result as string });
      reader.onerror = () => resolve({ error: 'Failed to read image file' });
      reader.readAsDataURL(file);
    });
  } catch (error: any) {
    return { error: error.message || 'Failed to upload image' };
  }
}

