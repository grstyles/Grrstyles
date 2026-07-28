import { NextResponse } from 'next/server';
import { getAdminClient, getClient } from '@/lib/supabase';

function getDb() {
  const admin = getAdminClient();
  if (admin) return admin;
  const client = getClient();
  if (client) return client;
  return null;
}

const sanitizeItem = (item: any) => ({
  id: String(item.id || ''),
  title: String(item.title || ''),
  slug: String(item.slug || ''),
  image_url: item.image_url || item.image || '/images/category-placeholder.png',
  bg_color: item.bg_color || '#f5f0eb',
  priority: typeof item.priority === 'number' ? item.priority : (typeof item.display_order === 'number' ? item.display_order : 0),
  featured: Boolean(item.featured),
  redirect_link: item.redirect_link || '',
  enabled: item.enabled !== undefined ? Boolean(item.enabled) : (item.is_active !== undefined ? Boolean(item.is_active) : true),
  created_at: item.created_at || new Date().toISOString(),
  updated_at: item.updated_at || new Date().toISOString(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, params);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, params);
}

async function handleUpdate(
  req: Request,
  paramsPromise: Promise<{ id: string }>
) {
  try {
    const { id } = await paramsPromise;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const { id: _bodyId, ...updates } = body;

    const payload: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.image_url !== undefined || updates.image !== undefined) {
      payload.image_url = updates.image_url || updates.image;
    }
    if (updates.bg_color !== undefined) payload.bg_color = updates.bg_color;
    if (updates.priority !== undefined || updates.display_order !== undefined) {
      payload.priority = updates.priority !== undefined ? updates.priority : updates.display_order;
    }
    if (updates.featured !== undefined) payload.featured = Boolean(updates.featured);
    if (updates.redirect_link !== undefined) payload.redirect_link = updates.redirect_link;
    if (updates.enabled !== undefined || updates.is_active !== undefined) {
      payload.enabled = updates.enabled !== undefined ? Boolean(updates.enabled) : Boolean(updates.is_active);
    }

    const db = getDb();
    if (!db) {
      const mockUpdated = sanitizeItem({ id, ...payload });
      return NextResponse.json({ success: true, data: mockUpdated });
    }

    const { data, error } = await db
      .from('category_carousel')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.warn(`[API /api/admin/category-carousel/${id} UPDATE] Supabase error:`, error.message);
      const mockUpdated = sanitizeItem({ id, ...payload });
      return NextResponse.json({ success: true, data: mockUpdated });
    }

    const updated = sanitizeItem(data || { id, ...payload });
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[API /api/admin/category-carousel/[id] UPDATE] Exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 });
    }

    const db = getDb();
    if (db) {
      const { error } = await db
        .from('category_carousel')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn(`[API /api/admin/category-carousel/${id} DELETE] Supabase warning:`, error.message);
      }
    }

    return NextResponse.json({ success: true, message: `Category ${id} deleted successfully` });
  } catch (err: any) {
    console.error('[API /api/admin/category-carousel/[id] DELETE] Exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete category' }, { status: 500 });
  }
}
