import { query, getSupabaseAdmin } from '../config/database';
import { Profile, UserRole } from '../models/profile';

export const profileRepository = {
  async findById(id: string): Promise<Profile | null> {
    try {
      const res = await query<Profile>('SELECT * FROM profiles WHERE id = $1', [id]);
      if (res.rows.length > 0) return res.rows[0];
    } catch {
      // Fallback to Supabase client
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
        if (!error && data) return data as Profile;
      }
    }
    return null;
  },

  async findByPhone(phone: string): Promise<Profile | null> {
    try {
      const res = await query<Profile>('SELECT * FROM profiles WHERE phone = $1', [phone]);
      if (res.rows.length > 0) return res.rows[0];
    } catch {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data, error } = await supabase.from('profiles').select('*').eq('phone', phone).maybeSingle();
        if (!error && data) return data as Profile;
      }
    }
    return null;
  },

  async findByEmail(email: string): Promise<Profile | null> {
    try {
      const res = await query<Profile>('SELECT * FROM profiles WHERE LOWER(email) = LOWER($1)', [email]);
      if (res.rows.length > 0) return res.rows[0];
    } catch {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data, error } = await supabase.from('profiles').select('*').ilike('email', email.trim()).maybeSingle();
        if (!error && data) return data as Profile;
      }
    }
    return null;
  },

  async findByReferralCode(code: string): Promise<Profile | null> {
    try {
      const res = await query<Profile>('SELECT * FROM profiles WHERE referral_code = $1', [code]);
      if (res.rows.length > 0) return res.rows[0];
    } catch {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data, error } = await supabase.from('profiles').select('*').eq('referral_code', code).maybeSingle();
        if (!error && data) return data as Profile;
      }
    }
    return null;
  },

  async create(data: {
    id?: string;
    phone?: string | null;
    email?: string | null;
    name?: string | null;
    avatar_url?: string | null;
    role?: UserRole;
    referred_by?: string | null;
  }): Promise<Profile> {
    const payload: any = {
      phone: data.phone || null,
      email: data.email ? data.email.toLowerCase().trim() : null,
      name: data.name || (data.email ? data.email.split('@')[0] : 'Customer'),
      avatar_url: data.avatar_url || null,
      role: data.role || 'customer',
      referred_by: data.referred_by || null,
      loyalty_points: 100,
    };
    if (data.id) payload.id = data.id;

    try {
      const res = await query<Profile>(
        `INSERT INTO profiles (
          id, phone, email, name, avatar_url, role, referred_by, loyalty_points
        ) VALUES (
          COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, COALESCE($6, 'customer'), $7, 100
        ) RETURNING *`,
        [
          data.id || null,
          payload.phone,
          payload.email,
          payload.name,
          payload.avatar_url,
          payload.role,
          payload.referred_by,
        ]
      );
      if (res.rows[0]) {
        // Also sync into users table
        try {
          await query(
            `INSERT INTO users (id, phone, name, email, created_at)
             VALUES ($1, $2, $3, $4, now())
             ON CONFLICT (id) DO UPDATE
             SET phone = COALESCE(EXCLUDED.phone, users.phone),
                 name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
                 email = COALESCE(EXCLUDED.email, users.email)`,
            [res.rows[0].id, payload.phone, payload.name, payload.email]
          );
        } catch {}
        return res.rows[0];
      }
    } catch (pgErr) {
      // Fallback to Supabase client
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: created, error } = await supabase
          .from('profiles')
          .upsert(payload, { onConflict: 'id' })
          .select('*')
          .single();

        if (!error && created) {
          try {
            await supabase.from('users').upsert({
              id: created.id,
              phone: payload.phone,
              name: payload.name,
              email: payload.email,
            }, { onConflict: 'id' });
          } catch {}
          return created as Profile;
        }
        if (error) {
          console.error('[profileRepository.create] Supabase error:', error.message);
        }
      }
    }

    return {
      id: data.id || `user-${Date.now()}`,
      ...payload,
      default_upi_id: null,
      referral_code: `REF${(data.id || 'USER').slice(0, 4)}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile;
  },

  async update(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (['name', 'phone', 'email', 'avatar_url', 'role', 'default_upi_id', 'loyalty_points', 'is_active'].includes(key)) {
        fields.push(`${key} = $${idx++}`);
        values.push(val);
      }
    }

    if (fields.length > 0) {
      try {
        values.push(id);
        const res = await query<Profile>(
          `UPDATE profiles SET ${fields.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`,
          values
        );

        // Also update users table in PostgreSQL
        try {
          await query(
            `UPDATE users
             SET name = COALESCE($2, name),
                 phone = COALESCE($3, phone),
                 email = COALESCE($4, email)
             WHERE id = $1`,
            [id, updates.name !== undefined ? updates.name : null, updates.phone !== undefined ? updates.phone : null, updates.email !== undefined ? updates.email : null]
          );
        } catch {}

        if (res.rows[0]) return res.rows[0];
      } catch {
        // Fallback to Supabase
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select('*')
            .maybeSingle();

          // Also update users table in Supabase
          try {
            const userUpdates: any = {};
            if (updates.name !== undefined) userUpdates.name = updates.name;
            if (updates.phone !== undefined) userUpdates.phone = updates.phone;
            if (updates.email !== undefined) userUpdates.email = updates.email;
            if (Object.keys(userUpdates).length > 0) {
              await supabase.from('users').update(userUpdates).eq('id', id);
            }
          } catch {}

          if (!error && data) return data as Profile;
        }
      }
    }

    return this.findById(id);
  },

  async listCustomers(params: { search?: string; limit?: number; offset?: number }): Promise<{ customers: any[]; total: number }> {
    const { search, limit = 50, offset = 0 } = params;
    let whereClause = 'WHERE p.role = $1';
    const values: any[] = ['customer'];
    let idx = 2;

    if (search) {
      whereClause += ` AND (p.name ILIKE $${idx} OR p.phone ILIKE $${idx} OR p.email ILIKE $${idx})`;
      values.push(`%${search}%`);
      idx++;
    }

    try {
      const countRes = await query<{ count: string }>(`SELECT COUNT(*) FROM profiles p ${whereClause}`, values);
      const total = parseInt(countRes.rows[0]?.count || '0', 10);

      values.push(limit, offset);
      const dataRes = await query<any>(
        `SELECT 
           p.*,
           COUNT(DISTINCT o.id) as total_orders,
           COALESCE(SUM(o.total_amount) FILTER (WHERE o.status != 'cancelled'), 0) as total_spent,
           COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as active_subscriptions
         FROM profiles p
         LEFT JOIN orders o ON o.user_id = p.id
         LEFT JOIN subscriptions s ON s.user_id = p.id
         ${whereClause}
         GROUP BY p.id
         ORDER BY p.created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        values
      );

      return {
        customers: dataRes.rows.map((c) => ({
          ...c,
          total_orders: parseInt(c.total_orders || '0', 10),
          total_spent: parseFloat(c.total_spent || '0'),
          active_subscriptions: parseInt(c.active_subscriptions || '0', 10),
        })),
        total,
      };
    } catch {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        let req = supabase.from('profiles').select('*', { count: 'exact' }).eq('role', 'customer');
        if (search) {
          req = req.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }
        const { data, count, error } = await req.range(offset, offset + limit - 1).order('created_at', { ascending: false });
        if (!error && data) {
          const customerIds = data.map((d: any) => d.id);
          let ordersMap: Record<string, { count: number; spent: number }> = {};
          let subsMap: Record<string, number> = {};

          if (customerIds.length > 0) {
            try {
              const [oRes, sRes] = await Promise.all([
                supabase.from('orders').select('user_id, total_amount, status').in('user_id', customerIds),
                supabase.from('subscriptions').select('user_id, status').in('user_id', customerIds).eq('status', 'active'),
              ]);
              if (oRes.data) {
                for (const ord of oRes.data) {
                  if (ord.status !== 'cancelled') {
                    if (!ordersMap[ord.user_id]) ordersMap[ord.user_id] = { count: 0, spent: 0 };
                    ordersMap[ord.user_id].count += 1;
                    ordersMap[ord.user_id].spent += parseFloat(ord.total_amount || '0');
                  }
                }
              }
              if (sRes.data) {
                for (const sub of sRes.data) {
                  subsMap[sub.user_id] = (subsMap[sub.user_id] || 0) + 1;
                }
              }
            } catch {}
          }

          const enriched = data.map((p: any) => ({
            ...p,
            total_orders: ordersMap[p.id]?.count || 0,
            total_spent: ordersMap[p.id]?.spent || 0,
            active_subscriptions: subsMap[p.id] || 0,
          }));

          return { customers: enriched, total: count || data.length };
        }
      }
    }

    return { customers: [], total: 0 };
  },

  async incrementLoyaltyPoints(id: string, points: number): Promise<void> {
    try {
      await query('UPDATE profiles SET loyalty_points = loyalty_points + $1, updated_at = now() WHERE id = $2', [points, id]);
    } catch {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const existing = await this.findById(id);
        if (existing) {
          await supabase.from('profiles').update({ loyalty_points: (existing.loyalty_points || 0) + points }).eq('id', id);
        }
      }
    }
  },
};
