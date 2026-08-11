import { query } from '../config/database';
import { Translation } from '../models/translation';

export const translationRepository = {
  async getByLanguage(language: string): Promise<Record<string, string>> {
    const res = await query<Translation>(
      'SELECT key, value FROM translations WHERE language = $1',
      [language]
    );

    const map: Record<string, string> = {};
    for (const row of res.rows) {
      map[row.key] = row.value;
    }
    return map;
  },

  async upsert(language: string, key: string, value: string): Promise<void> {
    await query(
      `INSERT INTO translations (language, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (language, key)
       DO UPDATE SET value = $3`,
      [language, key, value]
    );
  },

  async bulkUpsert(language: string, translations: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(translations)) {
      await this.upsert(language, key, value);
    }
  },
};
