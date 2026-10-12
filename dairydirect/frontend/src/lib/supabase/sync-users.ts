/**
 * Helper to sync user records into the public `users` table
 * in both PostgreSQL RDS and Supabase upon login / registration / profile update.
 */

import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function syncUserToUsersTable(user: {
  id: string;
  phone?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  country?: string | null;
  created_at?: string | null;
}) {
  if (!user.id) return;

  const phone = user.phone || null;
  const name = user.name || (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null);
  const email = user.email || null;
  const createdAt = user.created_at || new Date().toISOString();

  // 1. Sync RDS PostgreSQL users table if configured
  if (isPgConfigured) {
    try {
      await query(
        `INSERT INTO users (id, phone, name, email, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE
         SET phone = COALESCE(EXCLUDED.phone, users.phone),
             name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
             email = COALESCE(EXCLUDED.email, users.email)`,
        [user.id, phone, name, email, createdAt]
      );
    } catch (err: any) {
      console.warn('[SyncUsersTable] RDS error:', err.message);
    }
  }

  // 2. Sync Supabase users table (strictly matching public.users columns: id, phone, name, email, created_at)
  try {
    const sb = getAdminSupabase();
    const { error } = await sb.from('users').upsert(
      {
        id: user.id,
        phone,
        name,
        email,
        created_at: createdAt,
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.warn('[SyncUsersTable] Supabase upsert error:', error.message);
    }
  } catch (err: any) {
    console.warn('[SyncUsersTable] Supabase exception:', err.message);
  }
}

/**
 * Backfills all existing profiles into users table
 */
export async function backfillUsersTable() {
  try {
    const sb = getAdminSupabase();
    const { data: profiles, error: selectErr } = await sb
      .from('profiles')
      .select('id, phone, name, email, created_at');

    if (selectErr) {
      console.warn('[BackfillUsersTable] Select error:', selectErr.message);
      return;
    }

    if (profiles && profiles.length > 0) {
      const userInserts = profiles.map((p: any) => ({
        id: p.id,
        phone: p.phone || null,
        name: p.name || null,
        email: p.email || null,
        created_at: p.created_at || new Date().toISOString(),
      }));

      const { error: upsertErr } = await sb
        .from('users')
        .upsert(userInserts, { onConflict: 'id' });

      if (upsertErr) {
        console.warn('[BackfillUsersTable] Upsert error:', upsertErr.message);
      }
    }
  } catch (err: any) {
    console.warn('[BackfillUsersTable] Error:', err.message);
  }
}
