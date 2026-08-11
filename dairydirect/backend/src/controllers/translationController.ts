import { Request, Response, NextFunction } from 'express';
import { translationService } from '../services/translationService';
import { sendSuccess } from '../utils/response';

export const translationController = {
  async getTranslations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const language = (req.query.language as string) || 'en';
      const translations = await translationService.getTranslations(language);
      sendSuccess(res, { language, translations });
    } catch (error) {
      next(error);
    }
  },

  async updateTranslations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { language, translations } = req.body;
      await translationService.saveTranslations(language, translations);
      sendSuccess(res, { message: 'Translations updated successfully' });
    } catch (error) {
      next(error);
    }
  },
};
