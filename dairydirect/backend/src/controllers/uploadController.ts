import { Request, Response, NextFunction } from 'express';
import { imageKitService } from '../services/imageKitService';
import { sendSuccess, sendCreated } from '../utils/response';
import { ValidationError, UnauthorizedError } from '../errors/AppError';

export const uploadController = {
  /**
   * Generic Image Upload (Category-wise & Role-wise for Customer, Admin, Seller)
   * POST /api/upload/image
   */
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let file: Buffer | string | undefined;
      let fileName: string | undefined;

      if (req.file) {
        file = req.file.buffer;
        fileName = req.file.originalname;
      } else if (req.body?.image || req.body?.file) {
        file = req.body.image || req.body.file;
        fileName = req.body.fileName;
      }

      if (!file) {
        throw new ValidationError('No image file provided in multipart form-data or JSON body (field: image or file)');
      }

      const category = (req.body?.category || req.query?.category as string);
      const role = (req.body?.role || req.query?.role as string) || req.user?.role || 'customer';
      const entityType = (req.body?.entityType || req.query?.entityType as string);
      const entityId = (req.body?.entityId || req.query?.entityId as string) || req.user?.userId;
      const folder = (req.body?.folder || req.query?.folder as string);

      const tags = req.body?.tags
        ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(','))
        : ['dairydirect'];

      const tableName = req.body?.tableName || (req.query?.tableName as string);
      const recordId = req.body?.recordId || (req.query?.recordId as string);
      const columnName = req.body?.columnName || (req.query?.columnName as string);

      if (tableName && recordId && columnName) {
        const result = await imageKitService.uploadAndSaveGeneric({
          file,
          fileName,
          folder,
          category,
          role,
          entityType,
          entityId: recordId || entityId,
          tags,
          tableName,
          recordId,
          columnName,
        });
        sendCreated(res, result);
        return;
      }

      const uploadResult = await imageKitService.uploadFile({
        file,
        fileName: fileName || `img_${Date.now()}.jpg`,
        folder,
        category,
        role,
        entityType,
        entityId,
        tags,
      });

      sendCreated(res, {
        upload: uploadResult,
        url: uploadResult.url,
        folder: uploadResult.folder,
        category: category || 'general',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload Authenticated User's Avatar (Category: /customers/avatars or /admin/avatars)
   * POST /api/upload/avatar
   */
  async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required to upload profile avatar');
      }

      let file: Buffer | string | undefined;
      let fileName: string | undefined;

      if (req.file) {
        file = req.file.buffer;
        fileName = req.file.originalname;
      } else if (req.body?.image || req.body?.file) {
        file = req.body.image || req.body.file;
        fileName = req.body.fileName;
      }

      if (!file) {
        throw new ValidationError('No avatar image file provided');
      }

      const userRole = req.user.role || 'customer';

      const result = await imageKitService.uploadAndSaveUserAvatar(
        req.user.userId,
        file,
        fileName,
        userRole
      );

      sendSuccess(res, {
        message: 'Avatar uploaded to ImageKit and saved to Supabase successfully',
        profile: result.profile,
        upload: result.upload,
        avatar_url: result.upload.url,
        folder: result.upload.folder,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload Product Image (Category-wise: /products/{category} or /sellers/products/{category})
   * POST /api/upload/product/:productId
   */
  async uploadProductImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;
      if (!productId) {
        throw new ValidationError('Product ID is required');
      }

      let file: Buffer | string | undefined;
      let fileName: string | undefined;

      if (req.file) {
        file = req.file.buffer;
        fileName = req.file.originalname;
      } else if (req.body?.image || req.body?.file) {
        file = req.body.image || req.body.file;
        fileName = req.body.fileName;
      }

      if (!file) {
        throw new ValidationError('No product image file provided');
      }

      const category = req.body?.category || (req.query?.category as string);
      const role = req.user?.role || 'admin';

      const result = await imageKitService.uploadAndSaveProductImage(
        productId,
        file,
        fileName,
        category,
        role
      );

      sendSuccess(res, {
        message: 'Product image uploaded to ImageKit category folder and saved to Supabase successfully',
        product: result.product,
        upload: result.upload,
        image_url: result.upload.url,
        folder: result.upload.folder,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload Category Image (ImageKit Folder: /gjanandSarkar/admin/categories)
   * POST /api/upload/category or POST /api/upload/category/:categoryId
   */
  async uploadCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let file: Buffer | string | undefined;
      let fileName: string | undefined;

      if (req.file) {
        file = req.file.buffer;
        fileName = req.file.originalname;
      } else if (req.body?.image || req.body?.file) {
        file = req.body.image || req.body.file;
        fileName = req.body.fileName;
      }

      if (!file) {
        throw new ValidationError('No category image file provided');
      }

      const categoryId = req.params?.categoryId || req.body?.categoryId || (req.query?.categoryId as string);
      const categoryName = req.body?.name || req.body?.category || (req.query?.category as string);

      const result = await imageKitService.uploadAndSaveCategoryImage(
        file,
        fileName,
        categoryId,
        categoryName
      );

      sendCreated(res, {
        message: 'Category image uploaded to ImageKit admin folder successfully',
        category: result.category,
        upload: result.upload,
        url: result.upload.url,
        image_url: result.upload.url,
        folder: result.upload.folder,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload Seller Logo or Banner (Category-wise: /sellers/{sellerId}/logos or /sellers/{sellerId}/banners)

   * POST /api/upload/seller/:sellerId/:type (type: logo | banner)
   */
  async uploadSellerImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sellerId, type } = req.params;
      if (!sellerId) {
        throw new ValidationError('Seller ID is required');
      }
      if (type !== 'logo' && type !== 'banner') {
        throw new ValidationError("Upload type must be 'logo' or 'banner'");
      }

      let file: Buffer | string | undefined;
      let fileName: string | undefined;

      if (req.file) {
        file = req.file.buffer;
        fileName = req.file.originalname;
      } else if (req.body?.image || req.body?.file) {
        file = req.body.image || req.body.file;
        fileName = req.body.fileName;
      }

      if (!file) {
        throw new ValidationError(`No ${type} image file provided`);
      }

      const result = await imageKitService.uploadAndSaveSellerImage(
        sellerId,
        type,
        file,
        fileName
      );

      sendSuccess(res, {
        message: `Seller ${type} uploaded to ImageKit category folder and saved to Supabase successfully`,
        seller: result.seller,
        upload: result.upload,
        url: result.upload.url,
        folder: result.upload.folder,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload Return Request Proof Image (Category-wise: /customers/returns)
   * POST /api/upload/return/:returnId
   */
  async uploadReturnImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { returnId } = req.params;
      if (!returnId) {
        throw new ValidationError('Return Request ID is required');
      }

      let file: Buffer | string | undefined;
      let fileName: string | undefined;

      if (req.file) {
        file = req.file.buffer;
        fileName = req.file.originalname;
      } else if (req.body?.image || req.body?.file) {
        file = req.body.image || req.body.file;
        fileName = req.body.fileName;
      }

      if (!file) {
        throw new ValidationError('No return proof image file provided');
      }

      const userId = req.user?.userId;

      const result = await imageKitService.uploadAndSaveReturnImage(
        returnId,
        file,
        fileName,
        userId
      );

      sendSuccess(res, {
        message: 'Return proof image uploaded to ImageKit category folder and saved to Supabase successfully',
        returnRequest: result.returnRequest,
        upload: result.upload,
        image_url: result.upload.url,
        folder: result.upload.folder,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Client-side Direct Upload Auth Parameters
   * GET /api/upload/auth
   */
  async getAuthParams(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const params = imageKitService.getAuthenticationParameters();
      sendSuccess(res, params);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete Image by fileId
   * DELETE /api/upload/:fileId
   */
  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileId } = req.params;
      if (!fileId) {
        throw new ValidationError('File ID is required');
      }
      const success = await imageKitService.deleteFile(fileId);
      sendSuccess(res, { success, message: 'Image deleted from ImageKit' });
    } catch (error) {
      next(error);
    }
  },
};
