import { NextResponse } from 'next/server';
import { getAdminClient, getClient } from '@/lib/supabase';

function getDb() {
  const admin = getAdminClient();
  if (admin) return admin;
  const client = getClient();
  if (client) return client;
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = body; // Array of { id: string, priority: number }

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Items array is required' }, { status: 400 });
    }

    const db = getDb();
    if (db) {
      for (const item of items) {
        if (item.id && typeof item.priority === 'number') {
          await db
            .from('category_carousel')
            .update({ priority: item.priority, updated_at: new Date().toISOString() })
            .eq('id', item.id);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Order updated successfully' });
  } catch (err: any) {
    console.error('[API /api/admin/category-carousel/reorder POST] Exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update order' }, { status: 500 });
  }
}
