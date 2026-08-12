/**
 * ImageKit Image Upload API Client
 * Uploads images to ImageKit via DairyDirect Backend and saves to Supabase database.
 */

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const localToken = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (localToken) return localToken;

    const storeRaw = localStorage.getItem('gjanand-sarkar-storage');
    if (storeRaw) {
      try {
        const parsed = JSON.parse(storeRaw);
        if (parsed?.state?.user?.token) return parsed.state.user.token;
      } catch {}
    }

    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export interface UploadImageOptions {
  folder?: string;
  category?: string; // e.g. Milk, Ghee, Paneer, Curd, Avatars, Banners, Returns
  role?: 'customer' | 'admin' | 'seller' | string;
  entityType?: 'product' | 'avatar' | 'seller_logo' | 'seller_banner' | 'return_proof' | 'review' | 'banner' | 'general' | string;
  entityId?: string;
  tags?: string[];
  tableName?: string;
  recordId?: string;
  columnName?: string;
}

export interface UploadResult {
  url?: string;
  fileId?: string;
  folder?: string;
  category?: string;
  upload?: any;
  record?: any;
  error?: string;
}


/**
 * Upload an image file to ImageKit via backend API
 */
export async function uploadImageToImageKit(
  file: File | Blob | string,
  options: UploadImageOptions = {}
): Promise<UploadResult> {
  try {
    const token = await getAuthToken();
    const url = `${API_BASE}/api/upload/image`;

    let res: Response;

    if (typeof file === 'string') {
      // Base64 string or image URL
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          image: file,
          folder: options.folder,
          category: options.category,
          role: options.role,
          entityType: options.entityType,
          entityId: options.entityId,
          tags: options.tags,
          tableName: options.tableName,
          recordId: options.recordId,
          columnName: options.columnName,
        }),
      });
    } else {
      // Multipart FormData
      const formData = new FormData();
      formData.append('image', file);
      if (options.folder) formData.append('folder', options.folder);
      if (options.category) formData.append('category', options.category);
      if (options.role) formData.append('role', options.role);
      if (options.entityType) formData.append('entityType', options.entityType);
      if (options.entityId) formData.append('entityId', options.entityId);
      if (options.tags) formData.append('tags', options.tags.join(','));
      if (options.tableName) formData.append('tableName', options.tableName);
      if (options.recordId) formData.append('recordId', options.recordId);
      if (options.columnName) formData.append('columnName', options.columnName);

      res = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'ImageKit upload failed');
    }

    const payload = data.data || data;
    const imageUrl = payload.url || payload.upload?.url || payload.image_url;

    return {
      url: imageUrl,
      fileId: payload.upload?.fileId,
      folder: payload.folder || payload.upload?.folder,
      category: payload.category,
      upload: payload.upload,
      record: payload.record,
    };
  } catch (error: any) {
    console.error('[uploadImageToImageKit error]:', error?.message || error);
    return { error: error?.message || 'Failed to upload image' };
  }
}

/**
 * Upload user avatar and update profile in Supabase
 */
export async function uploadUserAvatar(file: File | Blob | string): Promise<UploadResult> {
  try {
    const token = await getAuthToken();
    const url = `${API_BASE}/api/upload/avatar`;

    let res: Response;

    if (typeof file === 'string') {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ image: file }),
      });
    } else {
      const formData = new FormData();
      formData.append('image', file);

      res = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.message || 'Avatar upload failed');
    }

    const payload = data.data || data;
    return {
      url: payload.avatar_url || payload.upload?.url,
      upload: payload.upload,
      record: payload.profile,
    };
  } catch (error: any) {
    console.error('[uploadUserAvatar error]:', error?.message || error);
    return { error: error?.message || 'Failed to upload avatar' };
  }
}
