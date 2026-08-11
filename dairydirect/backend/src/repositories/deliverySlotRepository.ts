import { query } from '../config/database';
import { DeliverySlot } from '../models/deliverySlot';

export const deliverySlotRepository = {
  async findActive(): Promise<DeliverySlot[]> {
    const res = await query<DeliverySlot>(
      'SELECT * FROM delivery_slots WHERE is_active = true ORDER BY start_time ASC'
    );
    return res.rows;
  },

  async findAll(): Promise<DeliverySlot[]> {
    const res = await query<DeliverySlot>('SELECT * FROM delivery_slots ORDER BY start_time ASC');
    return res.rows;
  },

  async create(data: {
    slotName: string;
    startTime: string;
    endTime: string;
    maxOrdersCapacity?: number;
  }): Promise<DeliverySlot> {
    const res = await query<DeliverySlot>(
      `INSERT INTO delivery_slots (
        slot_name, start_time, end_time, max_orders_capacity
      ) VALUES ($1, $2, $3, COALESCE($4, 100)) RETURNING *`,
      [data.slotName, data.startTime, data.endTime, data.maxOrdersCapacity || 100]
    );
    return res.rows[0];
  },

  async update(id: string, updates: Partial<DeliverySlot>): Promise<DeliverySlot | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (['slot_name', 'start_time', 'end_time', 'max_orders_capacity', 'is_active'].includes(key)) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const res = await query<DeliverySlot>(
      `UPDATE delivery_slots SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM delivery_slots WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
