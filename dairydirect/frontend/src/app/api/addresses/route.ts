import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getAuthUser } from '@/lib/api/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const auth = await getAuthUser(request);
    if (!auth || auth.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getAddresses error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rawList = (data || []).filter((item: any) => !item.is_deleted);
    
    // Ensure only 1 address is default
    const defaultIndices: number[] = [];
    rawList.forEach((addr: any, idx: number) => {
      if (addr.is_default) defaultIndices.push(idx);
    });

    let sanitized = rawList;
    if (defaultIndices.length > 1) {
      const trueDefaultIdx = defaultIndices[0];
      const nonDefaultIds: string[] = [];
      sanitized = rawList.map((addr: any, idx: number) => {
        if (idx === trueDefaultIdx) return { ...addr, is_default: true };
        if (addr.is_default) nonDefaultIds.push(addr.id);
        return { ...addr, is_default: false };
      });

      if (nonDefaultIds.length > 0) {
        // Clean up asynchronously in Supabase
        (async () => {
          try {
            await supabaseAdmin
              .from('user_addresses')
              .update({ is_default: false })
              .in('id', nonDefaultIds);
          } catch (e) {
            console.warn('Failed to clean non-default addresses in background:', e);
          }
        })();
      }
    }

    sanitized.sort((a: any, b: any) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));

    return NextResponse.json({ addresses: sanitized });
  } catch (error) {
    console.error('Addresses GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, label, address, lat, lng, isDefault } = body;

    if (auth.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isDefault) {
      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabaseAdmin
      .from('user_addresses')
      .insert({
        user_id: userId,
        label,
        address,
        lat: lat ?? null,
        lng: lng ?? null,
        is_default: Boolean(isDefault),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: data });
  } catch (error) {
    console.error('Addresses POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { addressId, userId, label, address, lat, lng, isDefault, makeDefaultOnly } = body;

    if (auth.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (makeDefaultOnly) {
      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);

      const { error } = await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (isDefault) {
      await supabaseAdmin
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const updatePayload: Record<string, any> = { is_default: Boolean(isDefault) };
    if (label !== undefined) updatePayload.label = label;
    if (address !== undefined) updatePayload.address = address;
    if (lat !== undefined) updatePayload.lat = lat;
    if (lng !== undefined) updatePayload.lng = lng;

    const { data, error } = await supabaseAdmin
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
  } catch (error) {
    console.error('Addresses PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const userId = searchParams.get('userId');

    if (!addressId || !userId || auth.userId !== userId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // 1. Direct delete
    const { error } = await supabaseAdmin
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      // If foreign key constraint on orders
      if (
        error.code === '23503' || 
        error.message?.toLowerCase().includes('foreign key') || 
        error.message?.includes('orders_address_id_fkey')
      ) {
        // Unlink past orders
        await supabaseAdmin
          .from('orders')
          .update({ address_id: null })
          .eq('address_id', addressId);

        // Retry delete
        const { error: retryError } = await supabaseAdmin
          .from('user_addresses')
          .delete()
          .eq('id', addressId)
          .eq('user_id', userId);

        if (!retryError) return NextResponse.json({ success: true });

        // Fallback soft delete
        await supabaseAdmin
          .from('user_addresses')
          .update({ is_deleted: true, is_default: false })
          .eq('id', addressId)
          .eq('user_id', userId);

        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Addresses DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}