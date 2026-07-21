// app/api/shipping/route.ts
// Public read-only endpoint – returns current shipping settings.
// Uses the service-role key so it always bypasses RLS and returns the real row.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('shipping_settings')
      .select('shipping_charge, free_shipping_above, free_delivery')
      .eq('id', 1)
      .single();

    if (error) {
      // Row missing – return safe defaults so checkout always renders
      console.warn('[/api/shipping] shipping_settings query error:', error.message);
      return NextResponse.json({
        shippingCharge: 0,
        freeShippingAbove: 0,
        freeDelivery: true,
      });
    }

    return NextResponse.json({
      shippingCharge:    Number(data.shipping_charge    ?? 0),
      freeShippingAbove: Number(data.free_shipping_above ?? 0),
      freeDelivery:     Boolean(data.free_delivery       ?? true),
    });
  } catch (e: any) {
    console.error('[/api/shipping] Unexpected error:', e?.message);
    return NextResponse.json({
      shippingCharge: 0,
      freeShippingAbove: 0,
      freeDelivery: true,
    });
  }
}
