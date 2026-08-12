import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../config/database';
import { sendSuccess, sendCreated } from '../utils/response';
import { AppError } from '../errors/AppError';

export const categoryController = {
  async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const supabase = getSupabaseAdmin();

      if (!supabase) {
        sendSuccess(res, { categories: [] });
        return;
      }

      let query = supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[Backend Categories GET notice]:', error.message);
        sendSuccess(res, { categories: [] });
        return;
      }

      sendSuccess(res, { categories: data || [] });
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, image_url, is_active, display_order } = req.body;

      if (!name || !name.trim()) {
        throw new AppError('Category name is required', 400, 'VALIDATION_ERROR');
      }

      if (!image_url || !image_url.trim()) {
        throw new AppError('Category image is required', 400, 'VALIDATION_ERROR');
      }

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        throw new AppError('Database service unavailable', 503, 'DATABASE_UNAVAILABLE');
      }

      const trimmedName = name.trim();
      const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            name: trimmedName,
            slug,
            description: description?.trim() || null,
            image_url: image_url.trim(),
            is_active: is_active !== false,
            display_order: display_order || 0,
          }
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505' || error.message.includes('unique constraint')) {
          throw new AppError(`Category "${trimmedName}" already exists`, 400, 'DUPLICATE_CATEGORY');
        }
        throw new AppError(error.message, 500, 'DATABASE_ERROR');
      }

      sendCreated(res, { category: data });
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, image_url, is_active, display_order } = req.body;

      const supabase = getSupabaseAdmin();
      if (!supabase) {
        throw new AppError('Database service unavailable', 503, 'DATABASE_UNAVAILABLE');
      }

      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) {
        updatePayload.name = name.trim();
        updatePayload.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (description !== undefined) updatePayload.description = description?.trim() || null;
      if (image_url !== undefined) updatePayload.image_url = image_url.trim();
      if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);
      if (display_order !== undefined) updatePayload.display_order = Number(display_order);

      const { data, error } = await supabase
        .from('categories')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new AppError(error.message, 500, 'DATABASE_ERROR');
      }

      sendSuccess(res, { category: data });
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        throw new AppError('Database service unavailable', 503, 'DATABASE_UNAVAILABLE');
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        throw new AppError(error.message, 500, 'DATABASE_ERROR');
      }

      sendSuccess(res, { message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
};
