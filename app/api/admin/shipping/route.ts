// app/api/admin/shipping/route.ts
// Uses the service-role key so it bypasses RLS and can write to shipping_settings.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is missing - API will use fallback");
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET  /api/admin/shipping  → return current settings
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('shipping_settings')
      .select('*')
      .eq('id', 1)  // Guarantees we're always reading the singleton row with id = 1
      .single();

    if (error) {
      console.error('GET shipping_settings error:', error);
      
      // If table is empty, return default values
      if (error.code === 'PGRST116') {
        console.log('📋 No shipping settings found, returning defaults');
        return NextResponse.json({
          shippingCharge: 100,
          freeShippingAbove: 999,
          freeDelivery: false,
        });
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ GET shipping_settings success:', data);
    // Return camelCase so every client consumer can use the same field names
    // without having to remap snake_case DB columns.
    return NextResponse.json({
      id: data.id,
      shippingCharge: Number(data.shipping_charge ?? 100),
      freeShippingAbove: Number(data.free_shipping_above ?? 0),
      freeDelivery: Boolean(data.free_delivery ?? false),
      estimatedDelivery: data.estimated_delivery ?? '3-5 days',
      shippingMessage: data.shipping_message ?? '',
      // cod_enabled defaults true if column not yet added (pre-migration)
      codEnabled: data.cod_enabled !== undefined && data.cod_enabled !== null
        ? Boolean(data.cod_enabled)
        : true,
    });
  } catch (e: any) {
    console.error('Unexpected error in GET /api/admin/shipping:', e);
    return NextResponse.json(
      { error: e?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/shipping  → upsert settings (id=1 singleton row)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('📥 POST /api/admin/shipping body:', body);

    const {
      shippingCharge,
      freeShippingAbove,
      freeDelivery,
      estimatedDelivery,
      shippingMessage,
      codEnabled,
    } = body;

    // Build payload with only columns that exist in the DB
    const payload: Record<string, unknown> = {
      id: 1, // singleton row – the table enforces id = 1
      updated_at: new Date().toISOString(),
    };

    if (shippingCharge !== undefined) payload.shipping_charge = Number(shippingCharge);
    if (freeShippingAbove !== undefined) payload.free_shipping_above = Number(freeShippingAbove);
    if (freeDelivery !== undefined) payload.free_delivery = Boolean(freeDelivery);
    if (estimatedDelivery !== undefined) payload.estimated_delivery = String(estimatedDelivery);
    if (shippingMessage !== undefined) payload.shipping_message = String(shippingMessage);
    if (codEnabled !== undefined) payload.cod_enabled = Boolean(codEnabled);

    console.log('📦 Upserting shipping_settings:', payload);

    const { data, error } = await supabaseAdmin
      .from('shipping_settings')
      .upsert([payload], { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Supabase upsert error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { 
          success: false,
          error: error.message, 
          details: error.details, 
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    console.log('✅ Upsert successful:', data);
    return NextResponse.json({ 
      success: true,
      data: data?.[0] || null,
    });
  } catch (e: any) {
    console.error('❌ Unexpected error in POST /api/admin/shipping:', e);
    return NextResponse.json(
      { 
        success: false,
        error: e?.message ?? 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}