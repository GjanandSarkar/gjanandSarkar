import ImageKit from 'imagekit';
import { config } from '../config/env';
import { query, getSupabaseAdmin } from '../config/database';
import { profileRepository } from '../repositories/profileRepository';
import { productRepository } from '../repositories/productRepository';
import { sellerRepository } from '../repositories/sellerRepository';
import { returnRepository } from '../repositories/returnRepository';
import { Profile } from '../models/profile';
import { Product } from '../models/product';
import { ReturnRequest } from '../models/returnRequest';
import { ValidationError, AppError } from '../errors/AppError';

export interface ImageKitUploadOptions {
  file: Buffer | string; // Buffer, base64 string, or remote URL
  fileName: string;
  folder?: string;
  category?: string; // e.g. Milk, Ghee, Paneer, Curd, Avatars, Banners, Returns
  role?: 'customer' | 'admin' | 'seller' | string;
  entityType?: 'product' | 'avatar' | 'seller_logo' | 'seller_banner' | 'return_proof' | 'review' | 'banner' | 'general' | string;
  entityId?: string;
  tags?: string[];
  useUniqueFileName?: boolean;
  isPrivateFile?: boolean;
  customCoordinates?: string;
  responseFields?: string[];
}

export interface ImageKitUploadResult {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  height?: number;
  width?: number;
  size?: number;
  filePath?: string;
  fileType?: string;
  isPrivateFile?: boolean;
  folder?: string;
}

export interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
}

// ─── Initialize ImageKit Client (Only Private Key Required) ─────
let imagekitInstance: ImageKit | null = null;

export function getImageKitClient(): ImageKit | null {
  if (imagekitInstance) return imagekitInstance;

  const privateKey = config.imagekitPrivateKey;
  if (privateKey) {
    imagekitInstance = new ImageKit({
      privateKey,
      publicKey: config.imagekitPublicKey || 'default_public_key',
      urlEndpoint: config.imagekitUrlEndpoint || 'https://ik.imagekit.io/dairydirect',
    });
    return imagekitInstance;
  }

  return null;
}

const APP_ROOT_FOLDER = '/gjanandSarkar';

/**
 * Resolve organized category-wise and role-wise folder paths in ImageKit
 * All folders and images are nested inside the root application folder '/gjanandSarkar'
 */
export function resolveCategoryFolder(options: {
  folder?: string;
  role?: string;
  category?: string;
  entityType?: string;
  entityId?: string;
}): string {
  if (options.folder && options.folder.trim().length > 0 && options.folder !== '/uploads') {
    let cleanFolder = options.folder.startsWith('/') ? options.folder : `/${options.folder}`;
    if (cleanFolder === '/categories' && (options.role === 'admin' || options.entityType === 'category')) {
      cleanFolder = '/admin/categories';
    }
    if (cleanFolder.startsWith(APP_ROOT_FOLDER)) {
      return cleanFolder;
    }
    return `${APP_ROOT_FOLDER}${cleanFolder}`;
  }

  const role = options.role?.toLowerCase();
  const category = options.category ? options.category.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : undefined;
  const entityType = options.entityType?.toLowerCase();
  const entityId = options.entityId;

  let subPath = '/uploads/general';

  // 1. Customer Uploads
  if (role === 'customer') {
    if (entityType === 'avatar') subPath = '/customers/avatars';
    else if (entityType === 'return_proof' || entityType === 'return') subPath = '/customers/returns';
    else if (entityType === 'review') subPath = '/customers/reviews';
    else if (category) subPath = `/customers/${category}`;
    else subPath = '/customers/uploads';
  }
  // 2. Seller Uploads
  else if (role === 'seller') {
    const sellerPrefix = entityId ? `/sellers/${entityId}` : '/sellers';
    if (entityType === 'seller_logo' || entityType === 'logo') subPath = `${sellerPrefix}/logos`;
    else if (entityType === 'seller_banner' || entityType === 'banner') subPath = `${sellerPrefix}/banners`;
    else if (entityType === 'kyc') subPath = `${sellerPrefix}/kyc`;
    else if (category) subPath = `${sellerPrefix}/products/${category}`;
    else subPath = `${sellerPrefix}/products`;
  }
  // 3. Admin Uploads
  else if (role === 'admin') {
    if (entityType === 'category' || entityType === 'categories') {
      subPath = category ? `/admin/categories/${category}` : '/admin/categories';
    }
    else if (entityType === 'banner' || entityType === 'promotions') subPath = '/admin/banners';
    else if (entityType === 'branding' || entityType === 'logo') subPath = '/admin/branding';
    else if (category) subPath = `/admin/products/${category}`;
    else subPath = '/admin/uploads';
  }

  // 4. Entity Type Specific Category Routing
  else if (entityType === 'category' || entityType === 'categories') {
    subPath = '/admin/categories';
  } else if (entityType === 'product') {
    subPath = category ? `/products/${category}` : '/products';
  } else if (entityType === 'avatar') {
    subPath = '/avatars';
  } else if (entityType === 'seller_logo' || entityType === 'logo') {
    subPath = '/sellers/logos';
  } else if (entityType === 'seller_banner' || entityType === 'banner') {
    subPath = '/sellers/banners';
  } else if (entityType === 'return_proof' || entityType === 'return') {
    subPath = '/returns';
  } else if (entityType === 'review') {
    subPath = '/reviews';
  }
  // 5. Direct Category Routing (e.g. Milk, Ghee, Paneer, Curd, Sweets, etc.)
  else if (category) {
    subPath = `/categories/${category}`;
  }

  return `${APP_ROOT_FOLDER}${subPath}`;
}



export const imageKitService = {
  /**
   * Check if ImageKit Private Key is configured
   */
  isConfigured(): boolean {
    return Boolean(config.imagekitPrivateKey);
  },

  /**
   * Upload using ImageKit REST API with Private Key (Basic Auth) or SDK
   * Organizes images into category-wise / role-wise folders
   */
  async uploadFile(options: ImageKitUploadOptions): Promise<ImageKitUploadResult> {
    const {
      file,
      fileName,
      folder,
      category,
      role,
      entityType,
      entityId,
      tags = ['dairydirect'],
      useUniqueFileName = true,
      isPrivateFile = false,
      customCoordinates,
      responseFields,
    } = options;

    if (!file) {
      throw new ValidationError('No file provided for ImageKit upload');
    }

    // Resolve category-wise folder
    const targetFolder = resolveCategoryFolder({
      folder,
      role,
      category,
      entityType,
      entityId,
    });

    const targetTags = [...tags];
    if (category && !targetTags.includes(category.toLowerCase())) {
      targetTags.push(category.toLowerCase());
    }
    if (role && !targetTags.includes(role.toLowerCase())) {
      targetTags.push(role.toLowerCase());
    }

    const privateKey = config.imagekitPrivateKey;

    // Fallback if private key is not configured in local environment
    if (!privateKey) {
      console.warn('[ImageKit] IMAGEKIT_PRIVATE_KEY is not set. Using dev fallback URL.');
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueSuffix = Date.now().toString(36);
      const mockUrl = `${config.imagekitUrlEndpoint || 'https://ik.imagekit.io/dairydirect'}${targetFolder}/${uniqueSuffix}_${sanitizedName}`;

      return {
        fileId: `mock_${uniqueSuffix}`,
        name: `${uniqueSuffix}_${sanitizedName}`,
        url: mockUrl,
        thumbnailUrl: `${mockUrl}?tr=w-200,h-200`,
        size: typeof file === 'string' ? file.length : (file as Buffer).length,
        filePath: `${targetFolder}/${uniqueSuffix}_${sanitizedName}`,
        fileType: 'image',
        isPrivateFile,
        folder: targetFolder,
      };
    }

    // Direct REST API Upload using ONLY ImageKit Private Key (Basic Auth)
    try {
      let filePayload: string;
      if (Buffer.isBuffer(file)) {
        filePayload = file.toString('base64');
      } else if (typeof file === 'string') {
        if (file.startsWith('data:')) {
          const commaIdx = file.indexOf(',');
          filePayload = commaIdx !== -1 ? file.slice(commaIdx + 1) : file;
        } else {
          filePayload = file; // URL or raw base64
        }
      } else {
        throw new ValidationError('Unsupported file format');
      }

      const formData = new FormData();
      formData.append('file', filePayload);
      formData.append('fileName', fileName || `image_${Date.now()}.jpg`);
      if (targetFolder) formData.append('folder', targetFolder);
      if (targetTags.length > 0) formData.append('tags', targetTags.join(','));
      formData.append('useUniqueFileName', String(useUniqueFileName));
      formData.append('isPrivateFile', String(isPrivateFile));
      if (customCoordinates) formData.append('customCoordinates', customCoordinates);
      if (responseFields && responseFields.length > 0) {
        formData.append('responseFields', responseFields.join(','));
      }

      const basicAuth = Buffer.from(`${privateKey}:`).toString('base64');
      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
        body: formData,
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        const errorMsg = data?.message || data?.help || 'ImageKit upload failed';
        console.error('[ImageKit REST Upload Error]:', errorMsg, data);
        throw new AppError(errorMsg, response.status, 'IMAGEKIT_UPLOAD_ERROR');
      }

      return {
        fileId: data.fileId,
        name: data.name,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl || `${data.url}?tr=w-200,h-200`,
        height: data.height,
        width: data.width,
        size: data.size,
        filePath: data.filePath,
        fileType: data.fileType,
        isPrivateFile: data.isPrivateFile,
        folder: targetFolder,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('[ImageKit Service Exception]:', error?.message || error);
      throw new AppError(
        error?.message || 'Failed to upload image to ImageKit',
        500,
        'IMAGEKIT_UPLOAD_FAILED'
      );
    }
  },

  /**
   * Delete an image from ImageKit using Private Key
   */
  async deleteFile(fileId: string): Promise<boolean> {
    if (!fileId || fileId.startsWith('mock_')) return true;

    const privateKey = config.imagekitPrivateKey;
    if (!privateKey) return true;

    try {
      const basicAuth = Buffer.from(`${privateKey}:`).toString('base64');
      const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
      });
      return response.ok;
    } catch (error: any) {
      console.error('[ImageKit Delete Error]:', error?.message || error);
      return false;
    }
  },

  /**
   * Generate authentication parameters for client-side direct uploads if needed
   */
  getAuthenticationParameters(token?: string, expire?: number): ImageKitAuthParams {
    const ik = getImageKitClient();
    if (!ik) {
      const now = Math.floor(Date.now() / 1000);
      return {
        token: token || `token_${Date.now()}`,
        expire: expire || now + 1800,
        signature: 'mock_signature',
      };
    }
    return ik.getAuthenticationParameters(token, expire);
  },

  /**
   * Upload user avatar to ImageKit category-wise and store the ImageKit URL in Supabase & PostgreSQL profiles
   */
  async uploadAndSaveUserAvatar(
    userId: string,
    file: Buffer | string,
    fileName?: string,
    role: string = 'customer'
  ): Promise<{ profile: Profile | null; upload: ImageKitUploadResult }> {
    const resolvedFileName = fileName || `avatar_${userId}_${Date.now()}.jpg`;

    // 1. Upload to ImageKit in category folder
    const uploadResult = await this.uploadFile({
      file,
      fileName: resolvedFileName,
      role,
      entityType: 'avatar',
      category: 'avatars',
      entityId: userId,
      tags: ['avatar', `user_${userId}`, role],
    });

    const imageUrl = uploadResult.url;

    // 2. Save ImageKit URL into Supabase & PostgreSQL profiles and users tables
    let updatedProfile: Profile | null = null;
    try {
      updatedProfile = await profileRepository.update(userId, {
        avatar_url: imageUrl,
      });
    } catch (err) {
      console.warn('[uploadAndSaveUserAvatar] profileRepository update warning:', err);
    }

    // Direct Supabase fallback
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from('profiles')
          .update({ avatar_url: imageUrl, updated_at: new Date().toISOString() })
          .eq('id', userId);
        await supabase.from('users').update({ avatar_url: imageUrl }).eq('id', userId);
      } catch (sbErr) {
        console.warn('[uploadAndSaveUserAvatar] Supabase direct update warning:', sbErr);
      }
    }

    if (!updatedProfile) {
      updatedProfile = await profileRepository.findById(userId);
    }

    return {
      profile: updatedProfile,
      upload: uploadResult,
    };
  },

  /**
   * Upload product image to ImageKit organized by product category (Milk, Ghee, Paneer, etc.)
   * and store the ImageKit URL in Supabase & PostgreSQL products table
   */
  async uploadAndSaveProductImage(
    productId: string,
    file: Buffer | string,
    fileName?: string,
    category?: string,
    role: string = 'admin'
  ): Promise<{ product: Product | null; upload: ImageKitUploadResult }> {
    const resolvedFileName = fileName || `product_${productId}_${Date.now()}.jpg`;

    // Lookup product category if not provided
    let resolvedCategory = category;
    if (!resolvedCategory) {
      try {
        const existing = await productRepository.findById(productId);
        if (existing?.category) {
          resolvedCategory = existing.category;
        }
      } catch {}
    }

    // 1. Upload to ImageKit in category-wise folder (/products/{category} or /sellers/products/{category})
    const uploadResult = await this.uploadFile({
      file,
      fileName: resolvedFileName,
      role,
      entityType: 'product',
      category: resolvedCategory || 'dairy',
      entityId: productId,
      tags: ['product', `prod_${productId}`, resolvedCategory || 'dairy', role],
    });

    const imageUrl = uploadResult.url;

    // 2. Save ImageKit URL in PostgreSQL / Supabase
    let updatedProduct: Product | null = null;
    try {
      updatedProduct = await productRepository.update(productId, {
        image_url: imageUrl,
      });
    } catch (err) {
      console.warn('[uploadAndSaveProductImage] productRepository update warning:', err);
    }

    // Direct Supabase fallback
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('products')
          .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
          .eq('id', productId)
          .select('*')
          .maybeSingle();

        if (data && !updatedProduct) {
          updatedProduct = data as Product;
        }
      } catch (sbErr) {
        console.warn('[uploadAndSaveProductImage] Supabase direct update warning:', sbErr);
      }
    }

    if (!updatedProduct) {
      updatedProduct = await productRepository.findById(productId);
    }

    return {
      product: updatedProduct,
      upload: uploadResult,
    };
  },

  /**
   * Upload category image to ImageKit organized in the admin category folder (/gjanandSarkar/admin/categories)
   * and optionally update Supabase categories table
   */
  async uploadAndSaveCategoryImage(
    file: Buffer | string,
    fileName?: string,
    categoryId?: string,
    categoryName?: string
  ): Promise<{ category: any | null; upload: ImageKitUploadResult }> {
    const resolvedFileName = fileName || `category_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

    const uploadResult = await this.uploadFile({
      file,
      fileName: resolvedFileName,
      folder: '/admin/categories',
      role: 'admin',
      entityType: 'category',
      category: categoryName || 'categories',
      tags: ['category', 'admin', ...(categoryName ? [categoryName.toLowerCase()] : [])],
    });

    const imageUrl = uploadResult.url;
    let updatedCategory: any = null;

    if (categoryId) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const { data } = await supabase
            .from('categories')
            .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
            .eq('id', categoryId)
            .select('*')
            .maybeSingle();

          if (data) {
            updatedCategory = data;
          }
        } catch (sbErr) {
          console.warn('[uploadAndSaveCategoryImage] Supabase update warning:', sbErr);
        }
      }
    }

    return {
      category: updatedCategory,
      upload: uploadResult,
    };
  },


  /**
   * Upload seller logo or banner to ImageKit category folder and update Supabase & PostgreSQL sellers table
   */
  async uploadAndSaveSellerImage(
    sellerId: string,
    imageType: 'logo' | 'banner',
    file: Buffer | string,
    fileName?: string
  ): Promise<{ seller: any | null; upload: ImageKitUploadResult }> {
    const resolvedFileName = fileName || `seller_${sellerId}_${imageType}_${Date.now()}.jpg`;

    // 1. Upload to ImageKit in category folder (/sellers/{sellerId}/logos or /sellers/{sellerId}/banners)
    const uploadResult = await this.uploadFile({
      file,
      fileName: resolvedFileName,
      role: 'seller',
      entityType: imageType === 'logo' ? 'seller_logo' : 'seller_banner',
      category: imageType === 'logo' ? 'logos' : 'banners',
      entityId: sellerId,
      tags: ['seller', imageType, `seller_${sellerId}`],
    });

    const imageUrl = uploadResult.url;
    const columnName = imageType === 'logo' ? 'logo_url' : 'banner_url';

    // 2. Update PostgreSQL database
    let updatedSeller: any = null;
    try {
      const res = await query(
        `UPDATE sellers SET ${columnName} = $1, updated_at = now() WHERE id = $2 RETURNING *`,
        [imageUrl, sellerId]
      );
      if (res.rows[0]) {
        updatedSeller = res.rows[0];
      }
    } catch (err) {
      console.warn('[uploadAndSaveSellerImage] SQL update warning:', err);
    }

    // Direct Supabase fallback
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('sellers')
          .update({ [columnName]: imageUrl, updated_at: new Date().toISOString() })
          .eq('id', sellerId)
          .select('*')
          .maybeSingle();

        if (data && !updatedSeller) {
          updatedSeller = data;
        }
      } catch (sbErr) {
        console.warn('[uploadAndSaveSellerImage] Supabase update warning:', sbErr);
      }
    }

    return {
      seller: updatedSeller || (await sellerRepository.findById(sellerId)),
      upload: uploadResult,
    };
  },

  /**
   * Upload return request proof image to ImageKit category folder and append URL to Supabase return_requests table
   */
  async uploadAndSaveReturnImage(
    returnId: string,
    file: Buffer | string,
    fileName?: string,
    userId?: string
  ): Promise<{ returnRequest: ReturnRequest | null; upload: ImageKitUploadResult }> {
    const resolvedFileName = fileName || `return_${returnId}_${Date.now()}.jpg`;

    // 1. Upload to ImageKit in category folder (/customers/returns or /returns)
    const uploadResult = await this.uploadFile({
      file,
      fileName: resolvedFileName,
      role: 'customer',
      entityType: 'return_proof',
      category: 'returns',
      entityId: returnId,
      tags: ['return_proof', `return_${returnId}`, ...(userId ? [`user_${userId}`] : [])],
    });

    const imageUrl = uploadResult.url;

    // 2. Append to return_requests images array
    let updatedReturn: ReturnRequest | null = null;
    try {
      const res = await query<ReturnRequest>(
        `UPDATE return_requests
         SET images = array_append(COALESCE(images, '{}'), $1)
         WHERE id = $2
         RETURNING *`,
        [imageUrl, returnId]
      );
      if (res.rows[0]) {
        updatedReturn = await returnRepository.findById(returnId);
      }
    } catch (err) {
      console.warn('[uploadAndSaveReturnImage] SQL update warning:', err);
    }

    // Direct Supabase fallback
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from('return_requests')
          .select('images')
          .eq('id', returnId)
          .maybeSingle();

        const currentImages = Array.isArray(existing?.images) ? existing.images : [];
        const nextImages = [...currentImages, imageUrl];

        const { data } = await supabase
          .from('return_requests')
          .update({ images: nextImages })
          .eq('id', returnId)
          .select('*')
          .maybeSingle();

        if (data && !updatedReturn) {
          updatedReturn = data as ReturnRequest;
        }
      } catch (sbErr) {
        console.warn('[uploadAndSaveReturnImage] Supabase update warning:', sbErr);
      }
    }

    return {
      returnRequest: updatedReturn || (await returnRepository.findById(returnId)),
      upload: uploadResult,
    };
  },

  /**
   * Universal helper: Upload to ImageKit category-wise and optionally persist URL in any Supabase / PostgreSQL table
   */
  async uploadAndSaveGeneric(params: {
    file: Buffer | string;
    fileName?: string;
    folder?: string;
    category?: string;
    role?: string;
    entityType?: string;
    entityId?: string;
    tags?: string[];
    tableName?: string;
    recordId?: string;
    columnName?: string;
  }): Promise<{ upload: ImageKitUploadResult; record?: any }> {
    const {
      file,
      fileName = `file_${Date.now()}.jpg`,
      folder,
      category,
      role,
      entityType,
      entityId,
      tags = ['general'],
      tableName,
      recordId,
      columnName,
    } = params;

    // 1. Upload to ImageKit in category-wise folder
    const uploadResult = await this.uploadFile({
      file,
      fileName,
      folder,
      category,
      role,
      entityType,
      entityId: entityId || recordId,
      tags,
    });

    let updatedRecord: any = null;

    // 2. If target table and column provided, update in Supabase / PostgreSQL
    if (tableName && recordId && columnName) {
      const allowedTables = ['profiles', 'users', 'products', 'sellers', 'seller_inquiries', 'return_requests'];
      const allowedColumns = ['avatar_url', 'image_url', 'logo_url', 'banner_url'];

      if (allowedTables.includes(tableName) && allowedColumns.includes(columnName)) {
        try {
          const res = await query(
            `UPDATE ${tableName} SET ${columnName} = $1, updated_at = now() WHERE id = $2 RETURNING *`,
            [uploadResult.url, recordId]
          );
          if (res.rows[0]) {
            updatedRecord = res.rows[0];
          }
        } catch (dbErr) {
          console.warn(`[uploadAndSaveGeneric] DB update error on ${tableName}.${columnName}:`, dbErr);
        }

        const supabase = getSupabaseAdmin();
        if (supabase) {
          try {
            const { data } = await supabase
              .from(tableName)
              .update({ [columnName]: uploadResult.url, updated_at: new Date().toISOString() })
              .eq('id', recordId)
              .select('*')
              .maybeSingle();

            if (data && !updatedRecord) {
              updatedRecord = data;
            }
          } catch (sbErr) {
            console.warn(`[uploadAndSaveGeneric] Supabase update error on ${tableName}.${columnName}:`, sbErr);
          }
        }
      }
    }

    return {
      upload: uploadResult,
      record: updatedRecord,
    };
  },
};
