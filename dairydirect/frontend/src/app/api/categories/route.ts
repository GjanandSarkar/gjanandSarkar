import { NextRequest, NextResponse } from 'next/server';
import { Category } from '@/lib/api/categories';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, categories: [] });
    }

    let query = supabaseAdmin
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet in Supabase schema cache
      console.warn('[Categories GET Supabase notice]:', error.message);
      return NextResponse.json({ success: true, categories: [] });
    }

    return NextResponse.json({
      success: true,
      categories: (data as Category[]) || [],
    });
  } catch (error: any) {
    console.error('[API /api/categories GET Error]:', error);
    return NextResponse.json(
      { success: false, categories: [], error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, image_url, display_order } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    if (!image_url || !image_url.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category image/icon is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([
        {
          name: trimmedName,
          slug,
          description: description?.trim() || null,
          image_url: image_url.trim(),
          display_order: display_order || 0,
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message.includes('unique constraint')) {
        return NextResponse.json(
          { success: false, error: `Category "${trimmedName}" already exists` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category: data as Category,
    });
  } catch (error: any) {
    console.error('[API /api/categories POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, image_url, display_order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      updatePayload.name = name.trim();
      updatePayload.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) {
      updatePayload.description = description?.trim() || null;
    }
    if (image_url !== undefined) {
      updatePayload.image_url = image_url.trim();
    }
    if (display_order !== undefined) {
      updatePayload.display_order = Number(display_order);
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category: data as Category,
    });
  } catch (error: any) {
    console.error('[API /api/categories PATCH Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('[API /api/categories DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
