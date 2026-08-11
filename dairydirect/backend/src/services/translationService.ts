import { translationRepository } from '../repositories/translationRepository';

export const translationService = {
  async getTranslations(language = 'en'): Promise<Record<string, string>> {
    return translationRepository.getByLanguage(language);
  },

  async saveTranslations(language: string, translations: Record<string, string>): Promise<void> {
    await translationRepository.bulkUpsert(language, translations);
  },
};
