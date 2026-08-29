/**
 * GET/POST/PUT/DELETE /api/addresses
 * User address book — AWS PostgreSQL + Supabase fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { isValidUUID } from '@/lib/security/sanitize';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auth = await getAuthUser(request);
    const userId = searchParams.get('userId') || auth?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth && !auth.isAdmin && auth.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isPgConfigured) {
      try {
        const result = await query(
          `SELECT * FROM user_addresses 
           WHERE user_id = $1 AND is_deleted = false
           ORDER BY is_default DESC, created_at DESC`,
          [userId]
        );
        return NextResponse.json({ addresses: result.rows });
      } catch (err: any) {
        console.warn('[Addresses GET] PG query failed, using Supabase fallback:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data, error } = await sb
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ addresses: [] });
    }

    return NextResponse.json({ addresses: data || [] });
  } catch (error: any) {
    console.error('[Addresses GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch addresses', addresses: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const auth = await getAuthUser(request);
    const userId = auth?.userId || body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { label, address, building, street, landmark, instructions, photo_url, lat, lng, isDefault } = body;

    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return NextResponse.json({ error: 'Please provide a valid address' }, { status: 400 });
    }

    if (isPgConfigured) {
      try {
        const newAddress = await withTransaction(async (client) => {
          if (isDefault) {
            await client.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
          }

          // Check if first address, make it default automatically
          const countRes = await client.query('SELECT COUNT(*) FROM user_addresses WHERE user_id = $1 AND is_deleted = false', [userId]);
          const shouldBeDefault = isDefault || parseInt(countRes.rows[0].count) === 0;

          const insertRes = await client.query(
            `INSERT INTO user_addresses (user_id, label, address, building, street, landmark, instructions, photo_url, lat, lng, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [userId, label || 'Home', address.trim(), building || null, street || null, landmark || null, instructions || null, photo_url || null, lat || null, lng || null, shouldBeDefault]
          );

          return insertRes.rows[0];
        });

        return NextResponse.json({ success: true, address: newAddress });
      } catch (err: any) {
        console.warn('[Addresses POST] PG insert failed, using Supabase fallback:', err.message);
      }
    }

    const sb = getAdminSupabase();
    if (isDefault) {
      await sb.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
    }

    const { count } = await sb
      .from('user_addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false);

    const shouldBeDefault = isDefault || (count === 0 || count === null);

    const { data, error } = await sb
      .from('user_addresses')
      .insert({
        user_id: userId,
        label: label || 'Home',
        address: address.trim(),
        building: building || null,
        street: street || null,
        landmark: landmark || null,
        instructions: instructions || null,
        photo_url: photo_url || null,
        lat: lat || null,
        lng: lng || null,
        is_default: shouldBeDefault,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: data });
  } catch (error: any) {
    console.error('[Addresses POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const auth = await getAuthUser(request);
    const userId = auth?.userId || body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { addressId, label, address, building, street, landmark, instructions, photo_url, lat, lng, isDefault, makeDefaultOnly } = body;

    if (!addressId || !isValidUUID(addressId)) {
      return NextResponse.json({ error: 'Valid address ID required' }, { status: 400 });
    }

    if (isPgConfigured) {
      try {
        const updated = await withTransaction(async (client) => {
          if (makeDefaultOnly || isDefault) {
            await client.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
          }

          if (makeDefaultOnly) {
            const res = await client.query(
              'UPDATE user_addresses SET is_default = true, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING *',
              [addressId, userId]
            );
            return res.rows[0];
          }

          const setParts = ['updated_at = now()'];
          const values: any[] = [addressId, userId];
          let pIdx = 3;

          if (label !== undefined) { setParts.push(`label = $${pIdx++}`); values.push(label); }
          if (address !== undefined) { setParts.push(`address = $${pIdx++}`); values.push(address); }
          if (building !== undefined) { setParts.push(`building = $${pIdx++}`); values.push(building); }
          if (street !== undefined) { setParts.push(`street = $${pIdx++}`); values.push(street); }
          if (landmark !== undefined) { setParts.push(`landmark = $${pIdx++}`); values.push(landmark); }
          if (instructions !== undefined) { setParts.push(`instructions = $${pIdx++}`); values.push(instructions); }
          if (photo_url !== undefined) { setParts.push(`photo_url = $${pIdx++}`); values.push(photo_url); }
          if (lat !== undefined) { setParts.push(`lat = $${pIdx++}`); values.push(lat); }
          if (lng !== undefined) { setParts.push(`lng = $${pIdx++}`); values.push(lng); }
          if (isDefault !== undefined) { setParts.push(`is_default = $${pIdx++}`); values.push(Boolean(isDefault)); }

          const res = await client.query(
            `UPDATE user_addresses SET ${setParts.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
            values
          );
          return res.rows[0];
        });

        return NextResponse.json({ success: true, address: updated });
      } catch (err: any) {
        console.warn('[Addresses PUT] PG update failed, using Supabase fallback:', err.message);
      }
    }

    const sb = getAdminSupabase();
    if (makeDefaultOnly || isDefault) {
      await sb.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
    }

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (makeDefaultOnly) updatePayload.is_default = true;
    if (label !== undefined) updatePayload.label = label;
    if (address !== undefined) updatePayload.address = address;
    if (building !== undefined) updatePayload.building = building;
    if (street !== undefined) updatePayload.street = street;
    if (landmark !== undefined) updatePayload.landmark = landmark;
    if (instructions !== undefined) updatePayload.instructions = instructions;
    if (photo_url !== undefined) updatePayload.photo_url = photo_url;
    if (lat !== undefined) updatePayload.lat = lat;
    if (lng !== undefined) updatePayload.lng = lng;
    if (isDefault !== undefined) updatePayload.is_default = Boolean(isDefault);

    const { data, error } = await sb
      .from('user_addresses')
      .update(updatePayload)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: data });
  } catch (error: any) {
    console.error('[Addresses PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');
    const userId = auth?.userId || searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!addressId || !isValidUUID(addressId)) {
      return NextResponse.json({ error: 'Valid address ID required' }, { status: 400 });
    }

    if (isPgConfigured) {
      try {
        // Unlink past orders referencing this address to prevent FK constraint errors
        await query('UPDATE orders SET address_id = NULL WHERE address_id = $1', [addressId]);

        // Hard delete from user_addresses table in PostgreSQL
        await query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [addressId, userId]);
        return NextResponse.json({ success: true });
      } catch (err: any) {
        console.warn('[Addresses DELETE] PG delete failed, using Supabase fallback:', err.message);
      }
    }

    const sb = getAdminSupabase();

    // 1. Unlink past orders referencing this address
    try {
      await sb.from('orders').update({ address_id: null }).eq('address_id', addressId);
    } catch (e) {
      console.warn('[Addresses DELETE] Orders unlink notice:', e);
    }

    // 2. Hard delete from user_addresses table in Supabase
    const { error: deleteError } = await sb
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (deleteError) {
      console.warn('[Addresses DELETE] Hard delete error, attempting soft delete fallback:', deleteError.message);
      const { error: softError } = await sb
        .from('user_addresses')
        .update({ is_deleted: true, is_default: false, updated_at: new Date().toISOString() })
        .eq('id', addressId)
        .eq('user_id', userId);

      if (softError) {
        return NextResponse.json({ error: softError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Addresses DELETE] Error:', error.message);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}