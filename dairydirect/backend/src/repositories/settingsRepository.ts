import { query } from '../config/database';
import { BusinessSettings } from '../models/settings';

const DEFAULT_SETTINGS: BusinessSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  min_order_value: 50.0,
  standard_delivery_fee: 25.0,
  delivery_cost: 25.0,
  free_delivery_threshold: 299.0,
  min_profit_margin_percent: 20.0,
  max_discount_percent: 30.0,
  freshness_guarantee_hours: 24,
  is_store_open: true,
  store_closure_reason: null,
  support_phone: '+91 98765 43210',
  support_email: 'care@gjanandsarkar.com',
  razorpay_enabled: true,
  cod_enabled: true,
  gst_rate_percent: 0.0,
  updated_at: new Date().toISOString(),
};

export const settingsRepository = {
  async getSettings(): Promise<BusinessSettings> {
    try {
      const res = await query<BusinessSettings>('SELECT * FROM business_settings LIMIT 1');
      if (res.rows[0]) {
        return res.rows[0];
      }

      // Default fallback insertion if empty
      const initRes = await query<BusinessSettings>(
        `INSERT INTO business_settings (
          min_order_value, standard_delivery_fee, delivery_cost, free_delivery_threshold,
          min_profit_margin_percent, max_discount_percent, freshness_guarantee_hours,
          is_store_open, support_phone, support_email, razorpay_enabled, cod_enabled
        ) VALUES (
          50.00, 25.00, 25.00, 299.00, 20.00, 30.00, 24, true, '+91 98765 43210', 'care@gjanandsarkar.com', true, true
        ) RETURNING *`
      );
      return initRes.rows[0] || DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async updateSettings(updates: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const fields: string[] = ['updated_at = now()'];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (
        [
          'min_order_value',
          'standard_delivery_fee',
          'delivery_cost',
          'free_delivery_threshold',
          'min_profit_margin_percent',
          'max_discount_percent',
          'freshness_guarantee_hours',
          'is_store_open',
          'store_closure_reason',
          'support_phone',
          'support_email',
          'razorpay_enabled',
          'cod_enabled',
          'gst_rate_percent',
        ].includes(key)
      ) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    try {
      const res = await query<BusinessSettings>(
        `UPDATE business_settings SET ${fields.join(', ')} RETURNING *`,
        values
      );
      return res.rows[0] || (await this.getSettings());
    } catch {
      return { ...DEFAULT_SETTINGS, ...updates };
    }
  },
};
