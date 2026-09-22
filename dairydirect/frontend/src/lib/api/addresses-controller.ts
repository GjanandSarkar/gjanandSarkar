import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { isValidUUID, AddressSchema } from '@/lib/security/sanitize';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { formatFullAddress, normalizeUserAddress } from '@/lib/api/addresses';

/**
 * Common Address Controller for /api/addresses and /api/addresses/[id]
 */

export async function handleGetAddresses(request: NextRequest, specificId?: string) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const addressId = specificId || searchParams.get('id');
    const requestedUserId = searchParams.get('userId');

    // Non-admins can strictly only fetch their own addresses
    const targetUserId = auth.isAdmin && requestedUserId ? requestedUserId : auth.userId;

    // 1. Fetch Single Address
    if (addressId) {
      if (!isValidUUID(addressId)) {
        return NextResponse.json({ error: 'Valid address ID required' }, { status: 400 });
      }

      if (isPgConfigured) {
        try {
          const res = await query(
            `SELECT * FROM user_addresses 
             WHERE id = $1 AND is_deleted = false`,
            [addressId]
          );
          const addr = res.rows[0];
          if (!addr || (!auth.isAdmin && addr.user_id !== auth.userId)) {
            return NextResponse.json({ error: 'Address not found' }, { status: 404 });
          }
          return NextResponse.json({ address: normalizeUserAddress(addr) });
        } catch (err: any) {
          console.warn('[Addresses GET single] PG error, using Supabase fallback:', err.message);
        }
      }

      const sb = getAdminSupabase();
      const { data, error } = await sb
        .from('user_addresses')
        .select('*')
        .eq('id', addressId)
        .eq('is_deleted', false)
        .maybeSingle();

      if (error || !data || (!auth.isAdmin && data.user_id !== auth.userId)) {
        return NextResponse.json({ error: 'Address not found' }, { status: 404 });
      }

      return NextResponse.json({ address: normalizeUserAddress(data) });
    }

    // 2. Fetch All Addresses for User
    if (isPgConfigured) {
      try {
        const res = await query(
          `SELECT * FROM user_addresses 
           WHERE user_id = $1 AND is_deleted = false
           ORDER BY is_default DESC, updated_at DESC, created_at DESC`,
          [targetUserId]
        );
        return NextResponse.json({ addresses: res.rows.map(normalizeUserAddress) });
      } catch (err: any) {
        console.warn('[Addresses GET list] PG error, using Supabase fallback:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data, error } = await sb
      .from('user_addresses')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_deleted', false)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ addresses: [] });
    }

    return NextResponse.json({ addresses: (data || []).map(normalizeUserAddress) });
  } catch (error: any) {
    console.error('[Addresses GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch addresses', addresses: [] }, { status: 500 });
  }
}

export async function handleCreateAddress(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody = await request.json().catch(() => ({}));

    // Server strictly derives userId from authenticated session
    const userId = auth.userId;

    // Pre-normalize incoming legacy field aliases if new fields are missing
    const preprocessedBody = {
      ...rawBody,
      flat_house_building: rawBody.flat_house_building || rawBody.building || rawBody.apartment || '',
      area_street_sector_village: rawBody.area_street_sector_village || rawBody.street || '',
      town_city: rawBody.town_city || rawBody.city || '',
      delivery_instructions: rawBody.delivery_instructions ?? rawBody.instructions ?? null,
      latitude: rawBody.latitude ?? rawBody.lat ?? null,
      longitude: rawBody.longitude ?? rawBody.lng ?? null,
      is_default: rawBody.is_default ?? rawBody.isDefault ?? false,
    };

    // Validate body
    const parseResult = AddressSchema.safeParse(preprocessedBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid address data',
          details: parseResult.error.issues.map((i) => i.message).join(' | '),
        },
        { status: 400 }
      );
    }

    const val = parseResult.data;

    const addressType = val.address_type;
    const country = val.country || 'India';
    const fullName = val.full_name.trim();
    const mobileNumber = val.mobile_number.trim();
    const pincode = val.pincode.trim();
    const flatHouseBuilding = (val.flat_house_building || val.building || '').trim();
    const areaStreet = (val.area_street_sector_village || val.street || '').trim();
    const landmark = val.landmark?.trim() || null;
    const townCity = (val.town_city || '').trim();
    const state = (val.state || 'Gujarat').trim();
    const saturdayDelivery = val.saturday_delivery ?? true;
    const sundayDelivery = val.sunday_delivery ?? true;
    const deliveryInstructions = val.delivery_instructions?.trim() || val.instructions?.trim() || null;
    const lat = val.latitude ?? val.lat ?? null;
    const lng = val.longitude ?? val.lng ?? null;
    const requestedDefault = Boolean(val.is_default || val.isDefault);

    // Deterministic legacy address string
    const legacyAddress = formatFullAddress({
      flat_house_building: flatHouseBuilding,
      area_street_sector_village: areaStreet,
      landmark,
      town_city: townCity,
      state,
      pincode,
      country,
    });

    const label = val.label?.trim() || (addressType === 'house' ? 'Home' : addressType === 'business' ? 'Office' : 'Other');

    // 1. RDS PostgreSQL execution
    if (isPgConfigured) {
      try {
        const created = await withTransaction(async (client) => {
          const countRes = await client.query(
            'SELECT COUNT(*) FROM user_addresses WHERE user_id = $1 AND is_deleted = false',
            [userId]
          );
          const activeCount = parseInt(countRes.rows[0].count, 10);
          const shouldBeDefault = requestedDefault || activeCount === 0;

          if (shouldBeDefault) {
            await client.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
          }

          const insertRes = await client.query(
            `INSERT INTO user_addresses (
               user_id, address_type, country, full_name, mobile_number,
               flat_house_building, area_street_sector_village, landmark, town_city, state, pincode,
               saturday_delivery, sunday_delivery, delivery_instructions,
               latitude, longitude, is_default, is_deleted,
               label, address,
               created_at, updated_at
             ) VALUES (
               $1, $2, $3, $4, $5,
               $6, $7, $8, $9, $10, $11,
               $12, $13, $14,
               $15, $16, $17, false,
               $18, $19,
               now(), now()
             ) RETURNING *`,
            [
              userId, addressType, country, fullName, mobileNumber,
              flatHouseBuilding, areaStreet, landmark, townCity, state, pincode,
              saturdayDelivery, sundayDelivery, deliveryInstructions,
              lat, lng, shouldBeDefault,
              label, legacyAddress
            ]
          );

          return insertRes.rows[0];
        });

        return NextResponse.json({ success: true, address: normalizeUserAddress(created) }, { status: 201 });
      } catch (err: any) {
        console.warn('[Addresses POST] PG insert failed, using Supabase fallback:', err.message);
      }
    }

    // 2. Supabase execution
    const sb = getAdminSupabase();

    const { count } = await sb
      .from('user_addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false);

    const shouldBeDefault = requestedDefault || (count === 0 || count === null);

    if (shouldBeDefault) {
      await sb.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
    }

    const { data, error } = await sb
      .from('user_addresses')
      .insert({
        user_id: userId,
        address_type: addressType,
        country,
        full_name: fullName,
        mobile_number: mobileNumber,
        flat_house_building: flatHouseBuilding,
        area_street_sector_village: areaStreet,
        landmark,
        town_city: townCity,
        state,
        pincode,
        saturday_delivery: saturdayDelivery,
        sunday_delivery: sundayDelivery,
        delivery_instructions: deliveryInstructions,
        latitude: lat,
        longitude: lng,
        is_default: shouldBeDefault,
        is_deleted: false,
        label,
        address: legacyAddress,
      })
      .select()
      .single();

    if (error) {
      console.error('[Addresses POST] Supabase insert failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: normalizeUserAddress(data) }, { status: 201 });
  } catch (error: any) {
    console.error('[Addresses POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}

export async function handleUpdateAddress(request: NextRequest, specificId?: string) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const addressId = specificId || body.addressId;

    if (!addressId || !isValidUUID(addressId)) {
      return NextResponse.json({ error: 'Valid address ID required' }, { status: 400 });
    }

    const { makeDefaultOnly, isDefault, is_default } = body;
    const shouldMakeDefault = makeDefaultOnly || isDefault || is_default;

    // Verify existing address and ownership
    let existingAddr: any = null;

    if (isPgConfigured) {
      try {
        const checkRes = await query('SELECT * FROM user_addresses WHERE id = $1 AND is_deleted = false', [addressId]);
        existingAddr = checkRes.rows[0];
      } catch (e) {}
    }

    if (!existingAddr) {
      const sb = getAdminSupabase();
      const { data } = await sb.from('user_addresses').select('*').eq('id', addressId).eq('is_deleted', false).maybeSingle();
      existingAddr = data;
    }

    if (!existingAddr) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Security check: non-admin can only update their own address
    if (!auth.isAdmin && existingAddr.user_id !== auth.userId) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const userId = existingAddr.user_id;

    // Handle makeDefaultOnly shortcut
    if (makeDefaultOnly) {
      if (isPgConfigured) {
        try {
          const updated = await withTransaction(async (client) => {
            await client.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
            const res = await client.query(
              'UPDATE user_addresses SET is_default = true, updated_at = now() WHERE id = $1 RETURNING *',
              [addressId]
            );
            return res.rows[0];
          });
          return NextResponse.json({ success: true, address: normalizeUserAddress(updated) });
        } catch (err: any) {
          console.warn('[Addresses PUT makeDefault] PG error, using Supabase fallback:', err.message);
        }
      }

      const sb = getAdminSupabase();
      await sb.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
      const { data, error } = await sb
        .from('user_addresses')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('id', addressId)
        .select()
        .single();

      if (error) {
        console.error('[Addresses PUT makeDefault] Supabase update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, address: normalizeUserAddress(data) });
    }

    // Validate update fields with partial schema
    const parseResult = AddressSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid address update data',
          details: parseResult.error.issues.map((i) => i.message).join(' | '),
        },
        { status: 400 }
      );
    }

    const val = parseResult.data;

    const merged = {
      address_type: val.address_type || existingAddr.address_type || 'house',
      country: val.country || existingAddr.country || 'India',
      full_name: val.full_name !== undefined ? val.full_name.trim() : existingAddr.full_name,
      mobile_number: val.mobile_number !== undefined ? val.mobile_number.trim() : existingAddr.mobile_number,
      flat_house_building: (val.flat_house_building !== undefined ? val.flat_house_building : (val.building !== undefined ? val.building : existingAddr.flat_house_building)) || '',
      area_street_sector_village: (val.area_street_sector_village !== undefined ? val.area_street_sector_village : (val.street !== undefined ? val.street : existingAddr.area_street_sector_village)) || '',
      landmark: val.landmark !== undefined ? (val.landmark?.trim() || null) : existingAddr.landmark,
      town_city: (val.town_city !== undefined ? val.town_city : (val.city !== undefined ? val.city : existingAddr.town_city)) || '',
      state: val.state !== undefined ? val.state.trim() : existingAddr.state,
      pincode: val.pincode !== undefined ? val.pincode.trim() : existingAddr.pincode,
      saturday_delivery: val.saturday_delivery !== undefined ? Boolean(val.saturday_delivery) : existingAddr.saturday_delivery,
      sunday_delivery: val.sunday_delivery !== undefined ? Boolean(val.sunday_delivery) : existingAddr.sunday_delivery,
      delivery_instructions: val.delivery_instructions !== undefined ? (val.delivery_instructions?.trim() || null) : (val.instructions !== undefined ? (val.instructions?.trim() || null) : existingAddr.delivery_instructions),
      latitude: val.latitude !== undefined ? val.latitude : (val.lat !== undefined ? val.lat : existingAddr.latitude),
      longitude: val.longitude !== undefined ? val.longitude : (val.lng !== undefined ? val.lng : existingAddr.longitude),
      is_default: shouldMakeDefault !== undefined ? Boolean(shouldMakeDefault) : existingAddr.is_default,
      label: val.label !== undefined ? val.label.trim() : existingAddr.label,
    };

    const deterministicAddress = formatFullAddress(merged);

    const updatePayload = {
      address_type: merged.address_type,
      country: merged.country,
      full_name: merged.full_name,
      mobile_number: merged.mobile_number,
      flat_house_building: merged.flat_house_building,
      area_street_sector_village: merged.area_street_sector_village,
      landmark: merged.landmark,
      town_city: merged.town_city,
      state: merged.state,
      pincode: merged.pincode,
      saturday_delivery: merged.saturday_delivery,
      sunday_delivery: merged.sunday_delivery,
      delivery_instructions: merged.delivery_instructions,
      latitude: merged.latitude,
      longitude: merged.longitude,
      is_default: merged.is_default,
      label: merged.label,
      address: deterministicAddress,
      updated_at: new Date().toISOString(),
    };

    if (isPgConfigured) {
      try {
        const updated = await withTransaction(async (client) => {
          if (merged.is_default) {
            await client.query('UPDATE user_addresses SET is_default = false WHERE user_id = $1', [userId]);
          }

          const res = await client.query(
            `UPDATE user_addresses SET
               address_type = $1, country = $2, full_name = $3, mobile_number = $4,
               flat_house_building = $5, area_street_sector_village = $6, landmark = $7,
               town_city = $8, state = $9, pincode = $10,
               saturday_delivery = $11, sunday_delivery = $12, delivery_instructions = $13,
               latitude = $14, longitude = $15, is_default = $16,
               label = $17, address = $18, updated_at = now()
             WHERE id = $19 AND user_id = $20
             RETURNING *`,
            [
              updatePayload.address_type, updatePayload.country, updatePayload.full_name, updatePayload.mobile_number,
              updatePayload.flat_house_building, updatePayload.area_street_sector_village, updatePayload.landmark,
              updatePayload.town_city, updatePayload.state, updatePayload.pincode,
              updatePayload.saturday_delivery, updatePayload.sunday_delivery, updatePayload.delivery_instructions,
              updatePayload.latitude, updatePayload.longitude, updatePayload.is_default,
              updatePayload.label, updatePayload.address,
              addressId, userId
            ]
          );

          return res.rows[0];
        });

        return NextResponse.json({ success: true, address: normalizeUserAddress(updated) });
      } catch (err: any) {
        console.warn('[Addresses PUT] PG update failed, using Supabase fallback:', err.message);
      }
    }

    const sb = getAdminSupabase();
    if (merged.is_default) {
      await sb.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
    }

    const { data, error } = await sb
      .from('user_addresses')
      .update(updatePayload)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Addresses PUT] Supabase update failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: normalizeUserAddress(data) });
  } catch (error: any) {
    console.error('[Addresses PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function handleDeleteAddress(request: NextRequest, specificId?: string) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const addressId = specificId || searchParams.get('id');

    if (!addressId || !isValidUUID(addressId)) {
      return NextResponse.json({ error: 'Valid address ID required' }, { status: 400 });
    }

    // Verify existing address and ownership
    let existingAddr: any = null;

    if (isPgConfigured) {
      try {
        const checkRes = await query('SELECT * FROM user_addresses WHERE id = $1 AND is_deleted = false', [addressId]);
        existingAddr = checkRes.rows[0];
      } catch (e) {}
    }

    if (!existingAddr) {
      const sb = getAdminSupabase();
      const { data } = await sb.from('user_addresses').select('*').eq('id', addressId).eq('is_deleted', false).maybeSingle();
      existingAddr = data;
    }

    if (!existingAddr) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Security check: non-admin can only delete their own address
    if (!auth.isAdmin && existingAddr.user_id !== auth.userId) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const userId = existingAddr.user_id;
    const wasDefault = Boolean(existingAddr.is_default);

    // Soft delete to maintain foreign key integrity with past orders
    if (isPgConfigured) {
      try {
        await withTransaction(async (client) => {
          await client.query(
            'UPDATE user_addresses SET is_deleted = true, is_default = false, updated_at = now() WHERE id = $1',
            [addressId]
          );

          // If deleting the default address, promote the most recently updated remaining address to default
          if (wasDefault) {
            const nextRes = await client.query(
              `SELECT id FROM user_addresses 
               WHERE user_id = $1 AND is_deleted = false 
               ORDER BY updated_at DESC, created_at DESC 
               LIMIT 1`,
              [userId]
            );
            if (nextRes.rows.length > 0) {
              await client.query(
                'UPDATE user_addresses SET is_default = true, updated_at = now() WHERE id = $1',
                [nextRes.rows[0].id]
              );
            }
          }
        });

        return NextResponse.json({ success: true, message: 'Address deleted successfully' });
      } catch (err: any) {
        console.warn('[Addresses DELETE] PG error, using Supabase fallback:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { error: softError } = await sb
      .from('user_addresses')
      .update({ is_deleted: true, is_default: false, updated_at: new Date().toISOString() })
      .eq('id', addressId);

    if (softError) {
      return NextResponse.json({ error: softError.message }, { status: 500 });
    }

    // Promote next address to default if needed
    if (wasDefault) {
      const { data: remaining } = await sb
        .from('user_addresses')
        .select('id')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (remaining && remaining.length > 0) {
        await sb
          .from('user_addresses')
          .update({ is_default: true, updated_at: new Date().toISOString() })
          .eq('id', remaining[0].id);
      }
    }

    return NextResponse.json({ success: true, message: 'Address deleted successfully' });
  } catch (error: any) {
    console.error('[Addresses DELETE] Error:', error.message);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
