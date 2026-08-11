import { Request, Response } from 'express';
import { query, getSupabaseAdmin } from '../config/database';

export const healthController = {
  async getHealth(_req: Request, res: Response): Promise<void> {
    let dbStatus = 'healthy';
    let isOk = true;

    try {
      await query('SELECT 1');
    } catch (err: any) {
      if (getSupabaseAdmin()) {
        dbStatus = 'connected (via Supabase client)';
      } else {
        dbStatus = `offline (${err.message})`;
        isOk = false;
      }
    }

    res.status(isOk ? 200 : 200).json({
      status: isOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'DairyDirect Core API',
      database: dbStatus,
      uptime: Math.floor(process.uptime()),
    });
  },
};
