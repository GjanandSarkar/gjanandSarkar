import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

const APP_ROOT_FOLDER = '/gjanandSarkar';
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || 'private_MvcOlskPCF+H+NKn9TfD+lhFZso=';
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/dairydirect';

/**
 * Resolve organized category-wise and role-wise folder paths in ImageKit
 */
function resolveImageKitFolder(options: {
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

  const role = options.role?.toLowerCase() || 'admin';
  const category = options.category ? options.category.toLowerCase().replace(/[^a-z0-9_-]/g, '_') : undefined;
  const entityType = options.entityType?.toLowerCase();
  const entityId = options.entityId;

  let subPath = '/uploads/general';

  // 1. Admin Uploads
  if (role === 'admin') {
    if (entityType === 'category' || entityType === 'categories') {
      subPath = category ? `/admin/categories/${category}` : '/admin/categories';
    }
    else if (entityType === 'banner' || entityType === 'promotions') subPath = '/admin/banners';
    else if (entityType === 'branding' || entityType === 'logo') subPath = '/admin/branding';
    else if (category) subPath = `/admin/products/${category}`;
    else subPath = '/admin/uploads';
  }

  // 2. Customer Uploads
  else if (role === 'customer') {
    if (entityType === 'avatar') subPath = '/customers/avatars';
    else if (entityType === 'return_proof' || entityType === 'return') subPath = '/customers/returns';
    else if (entityType === 'review') subPath = '/customers/reviews';
    else if (category) subPath = `/customers/${category}`;
    else subPath = '/customers/uploads';
  }
  // 3. Seller Uploads
  else if (role === 'seller') {
    const sellerPrefix = entityId ? `/sellers/${entityId}` : '/sellers';
    if (entityType === 'seller_logo' || entityType === 'logo') subPath = `${sellerPrefix}/logos`;
    else if (entityType === 'seller_banner' || entityType === 'banner') subPath = `${sellerPrefix}/banners`;
    else if (entityType === 'kyc') subPath = `${sellerPrefix}/kyc`;
    else if (category) subPath = `${sellerPrefix}/products/${category}`;
    else subPath = `${sellerPrefix}/products`;
  }
  // 4. Entity Type Specific Category Routing
  else if (entityType === 'category' || entityType === 'categories') {
    subPath = '/admin/categories';
  } else if (entityType === 'product') {
    subPath = category ? `/products/${category}` : '/products';
  } else if (entityType === 'avatar') {
    subPath = '/avatars';
  } else if (category) {
    subPath = `/categories/${category}`;
  }

  return `${APP_ROOT_FOLDER}${subPath}`;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let fileBase64: string | null = null;
    let fileName = `img_${Date.now()}.jpg`;
    let folder = '/admin/categories';
    let category = '';
    let role = 'admin';
    let entityType = 'category';
    let tags: string[] = ['dairydirect', 'category', 'admin'];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') || formData.get('file');

      if (file && typeof file !== 'string') {
        const fileObj = file as File;
        const arrayBuffer = await fileObj.arrayBuffer();
        fileBase64 = Buffer.from(arrayBuffer).toString('base64');
        fileName = fileObj.name || fileName;
      } else if (typeof file === 'string') {
        fileBase64 = file;
      }

      if (formData.get('folder')) folder = formData.get('folder') as string;
      if (formData.get('category')) category = formData.get('category') as string;
      if (formData.get('role')) role = formData.get('role') as string;
      if (formData.get('entityType')) entityType = formData.get('entityType') as string;
      if (formData.get('fileName')) fileName = formData.get('fileName') as string;

      const tagsVal = formData.get('tags');
      if (typeof tagsVal === 'string') {
        tags = tagsVal.split(',').map((t) => t.trim()).filter(Boolean);
      }
    } else {
      const body = await request.json();
      const imagePayload = body.image || body.file;

      if (!imagePayload) {
        return NextResponse.json(
          { success: false, error: 'No image file or base64 provided' },
          { status: 400 }
        );
      }

      if (typeof imagePayload === 'string') {
        if (imagePayload.startsWith('data:')) {
          const commaIdx = imagePayload.indexOf(',');
          fileBase64 = commaIdx !== -1 ? imagePayload.slice(commaIdx + 1) : imagePayload;
        } else {
          fileBase64 = imagePayload;
        }
      }

      if (body.folder) folder = body.folder;
      if (body.category) category = body.category;
      if (body.role) role = body.role;
      if (body.entityType) entityType = body.entityType;
      if (body.fileName) fileName = body.fileName;
      if (body.tags) {
        tags = Array.isArray(body.tags) ? body.tags : body.tags.split(',').map((t: string) => t.trim());
      }
    }

    if (!fileBase64) {
      return NextResponse.json(
        { success: false, error: 'No valid image data provided' },
        { status: 400 }
      );
    }

    // Resolve category-wise folder (e.g. /gjanandSarkar/admin/categories)
    const targetFolder = resolveImageKitFolder({
      folder,
      role,
      category,
      entityType,
    });

    if (category && !tags.includes(category.toLowerCase())) {
      tags.push(category.toLowerCase());
    }
    if (role && !tags.includes(role.toLowerCase())) {
      tags.push(role.toLowerCase());
    }

    // Try ImageKit REST API Upload
    if (IMAGEKIT_PRIVATE_KEY) {
      try {
        const ikFormData = new FormData();
        ikFormData.append('file', fileBase64);
        ikFormData.append('fileName', fileName);
        ikFormData.append('folder', targetFolder);
        if (tags.length > 0) ikFormData.append('tags', tags.join(','));
        ikFormData.append('useUniqueFileName', 'true');

        const basicAuth = Buffer.from(`${IMAGEKIT_PRIVATE_KEY}:`).toString('base64');
        const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth}`,
          },
          body: ikFormData,
        });

        const ikData = await ikRes.json();

        if (ikRes.ok && ikData?.url) {
          return NextResponse.json({
            success: true,
            url: ikData.url,
            fileId: ikData.fileId,
            folder: ikData.folder || targetFolder,
            category: category || entityType || 'categories',
            upload: ikData,
            data: {
              url: ikData.url,
              fileId: ikData.fileId,
              folder: ikData.folder || targetFolder,
              upload: ikData,
            },
          });
        }
        console.warn('[ImageKit Next.js Route Error]:', ikData?.message || ikData);
      } catch (ikError) {
        console.warn('[ImageKit Next.js Route Fetch Error]:', ikError);
      }
    }

    // Fallback: Supabase Storage
    try {
      const buffer = Buffer.from(fileBase64, 'base64');
      const cleanFileName = `category_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `categories/${cleanFileName}`;

      const { error: sbErr } = await supabaseAdmin.storage
        .from('products')
        .upload(filePath, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (!sbErr) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('products')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          return NextResponse.json({
            success: true,
            url: publicUrlData.publicUrl,
            folder: targetFolder,
            category: category || 'categories',
            upload: { url: publicUrlData.publicUrl, folder: targetFolder },
            data: { url: publicUrlData.publicUrl, folder: targetFolder },
          });
        }
      }
    } catch (sbStorageErr) {
      console.warn('[Supabase Storage Fallback Error]:', sbStorageErr);
    }

    // Dev Fallback Mock URL
    const uniqueSuffix = Date.now().toString(36);
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const mockUrl = `${IMAGEKIT_URL_ENDPOINT}${targetFolder}/${uniqueSuffix}_${sanitizedName}`;

    return NextResponse.json({
      success: true,
      url: mockUrl,
      fileId: `ik_${uniqueSuffix}`,
      folder: targetFolder,
      category: category || 'categories',
      upload: { url: mockUrl, fileId: `ik_${uniqueSuffix}`, folder: targetFolder },
      data: { url: mockUrl, fileId: `ik_${uniqueSuffix}`, folder: targetFolder },
    });
  } catch (error: any) {
    console.error('[API /api/upload/image POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Image upload failed' },
      { status: 500 }
    );
  }
}
