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
  const name = user.name || null;
  const firstName = user.first_name || null;
  const lastName = user.last_name || null;
  const email = user.email || null;
  const country = user.country || 'India';
  const createdAt = user.created_at || new Date().toISOString();

  // 1. Sync RDS PostgreSQL users table if configured
  if (isPgConfigured) {
    try {
      await query(
        `INSERT INTO users (id, phone, name, first_name, last_name, email, country, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE
         SET phone = COALESCE(EXCLUDED.phone, users.phone),
             name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
             first_name = COALESCE(EXCLUDED.first_name, users.first_name),
             last_name = COALESCE(EXCLUDED.last_name, users.last_name),
             email = COALESCE(EXCLUDED.email, users.email),
             country = COALESCE(EXCLUDED.country, users.country)`,
        [user.id, phone, name, firstName, lastName, email, country, createdAt]
      );
    } catch (err: any) {
      console.warn('[SyncUsersTable] RDS error:', err.message);
    }
  }

  // 2. Sync Supabase users table
  try {
    const sb = getAdminSupabase();
    await sb.from('users').upsert(
      {
        id: user.id,
        phone,
        name,
        first_name: firstName,
        last_name: lastName,
        email,
        country,
        created_at: createdAt,
      },
      { onConflict: 'id' }
    );
  } catch (err: any) {
    console.warn('[SyncUsersTable] Supabase error:', err.message);
  }
}

/**
 * Backfills all existing profiles into users table
 */
export async function backfillUsersTable() {
  try {
    const sb = getAdminSupabase();
    const { data: profiles } = await sb.from('profiles').select('id, phone, name, first_name, last_name, email, country, created_at');
    if (profiles && profiles.length > 0) {
      const userInserts = profiles.map((p: any) => ({
        id: p.id,
        phone: p.phone || null,
        name: p.name || null,
        first_name: p.first_name || null,
        last_name: p.last_name || null,
        email: p.email || null,
        country: p.country || 'India',
        created_at: p.created_at || new Date().toISOString(),
      }));
      await sb.from('users').upsert(userInserts, { onConflict: 'id' });
    }
  } catch (err: any) {
    console.warn('[BackfillUsersTable] Error:', err.message);
  }
}
