/**
 * GET/POST/PUT/DELETE /api/addresses
 * User address book — AWS PostgreSQL version.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { isValidUUID } from '@/lib/security/sanitize';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || auth.userId;

    if (!auth.isAdmin && auth.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await query(
      `SELECT * FROM user_addresses 
       WHERE user_id = $1 AND is_deleted = false
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    return NextResponse.json({ addresses: result.rows });
  } catch (error: any) {
    console.error('[Addresses GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { label, address, lat, lng, isDefault } = body;

    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return NextResponse.json({ error: 'Please provide a valid address' }, { status: 400 });
    }

    const newAddress = await withTransaction(async (client) => {
      if (isDefault) {
        await client.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [auth.userId]);
      }

      // Check if first address, make it default automatically
      const countRes = await client.query('SELECT COUNT(*) FROM user_addresses WHERE user_id = $1 AND is_deleted = false', [auth.userId]);
      const shouldBeDefault = isDefault || parseInt(countRes.rows[0].count) === 0;

      const insertRes = await client.query(
        `INSERT INTO user_addresses (user_id, label, address, lat, lng, is_default)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [auth.userId, label || 'Home', address.trim(), lat || null, lng || null, shouldBeDefault]
      );

      return insertRes.rows[0];
    });

    return NextResponse.json({ success: true, address: newAddress });
  } catch (error: any) {
    console.error('[Addresses POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { addressId, label, address, lat, lng, isDefault, makeDefaultOnly } = body;

    if (!addressId || !isValidUUID(addressId)) {
      return NextResponse.json({ error: 'Valid address ID required' }, { status: 400 });
    }

    const updated = await withTransaction(async (client) => {
      if (makeDefaultOnly || isDefault) {
        await client.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [auth.userId]);
      }

      if (makeDefaultOnly) {
        const res = await client.query(
          'UPDATE user_addresses SET is_default = true, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING *',
          [addressId, auth.userId]
        );
        return res.rows[0];
      }

      const setParts = ['updated_at = now()'];
      const values: any[] = [addressId, auth.userId];
      let pIdx = 3;

      if (label !== undefined) { setParts.push(`label = $${pIdx++}`); values.push(label); }
      if (address !== undefined) { setParts.push(`address = $${pIdx++}`); values.push(address); }
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
  } catch (error: any) {
    console.error('[Addresses PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get('id');

    if (!addressId || !isValidUUID(addressId)) {
      return NextResponse.json({ error: 'Valid address ID required' }, { status: 400 });
    }

    // Soft delete to protect past orders foreign keys
    await query(
      'UPDATE user_addresses SET is_deleted = true, is_default = false, updated_at = now() WHERE id = $1 AND user_id = $2',
      [addressId, auth.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Addresses DELETE] Error:', error.message);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}