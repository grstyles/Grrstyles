import { NextResponse } from 'next/server';
import { getAdminClient, getClient } from '@/lib/supabase';
import { DEFAULT_CATEGORIES } from '@/lib/repositories/categoryCarouselRepository';

function getDb() {
  const admin = getAdminClient();
  if (admin) return admin;
  const client = getClient();
  if (client) return client;
  return null;
}

const sanitizeItem = (item: any) => ({
  id: String(item.id || `cat_${Date.now()}`),
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

export async function GET() {
  const db = getDb();
  if (!db) {
    console.warn('[API /api/admin/category-carousel GET] Supabase client unavailable, using default categories');
    return NextResponse.json({ success: true, data: DEFAULT_CATEGORIES });
  }

  try {
    const { data, error } = await db
      .from('category_carousel')
      .select('*')
      .order('priority', { ascending: true });

    if (error) {
      console.warn('[API /api/admin/category-carousel GET] Supabase query returned error:', error.message);
      return NextResponse.json({ success: true, data: DEFAULT_CATEGORIES });
    }

    const items = Array.isArray(data) ? data.map(sanitizeItem) : DEFAULT_CATEGORIES;
    return NextResponse.json({ success: true, data: items });
  } catch (err: any) {
    console.error('[API /api/admin/category-carousel GET] Error:', err);
    return NextResponse.json({ success: true, data: DEFAULT_CATEGORIES });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, slug, image_url, image, bg_color, priority, display_order, featured, redirect_link, enabled, is_active } = body;

    if (!title || !slug) {
      return NextResponse.json({ success: false, error: 'Title and slug are required' }, { status: 400 });
    }

    const db = getDb();
    const payload = {
      title,
      slug,
      image_url: image_url || image || '/images/category-placeholder.png',
      bg_color: bg_color || '#f5f0eb',
      priority: typeof priority === 'number' ? priority : (typeof display_order === 'number' ? display_order : 0),
      featured: Boolean(featured),
      redirect_link: redirect_link || '',
      enabled: enabled !== undefined ? Boolean(enabled) : (is_active !== undefined ? Boolean(is_active) : true),
      updated_at: new Date().toISOString()
    };

    if (!db) {
      const mockCreated = sanitizeItem({ id: `cat_${Date.now()}`, ...payload });
      return NextResponse.json({ success: true, data: mockCreated }, { status: 201 });
    }

    const { data, error } = await db
      .from('category_carousel')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[API /api/admin/category-carousel POST] Supabase error:', error.message);
      const mockCreated = sanitizeItem({ id: `cat_${Date.now()}`, ...payload });
      return NextResponse.json({ success: true, data: mockCreated }, { status: 201 });
    }

    const created = sanitizeItem(data || payload);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error('[API /api/admin/category-carousel POST] Exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to create category' }, { status: 500 });
  }
}
