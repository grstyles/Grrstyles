// app/api/razorpay/check-order-status/route.ts
//
// iOS-safe fallback: checks whether a Razorpay order has a captured payment
// WITHOUT requiring the client-side signature (which iOS may not deliver).
// Used only when the page regains focus/visibility after an external UPI app.
//
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (() => { throw new Error('Supabase service role key not set'); })()
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      userId,
      orderPayload,
      items,
    } = body;

    if (!razorpay_order_id || !orderPayload || !items) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { success: false, error: 'Razorpay configuration error' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    // ── 1. Check if our database already has an order for this Razorpay order ──
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle();

    if (existingOrder) {
      console.log('[iOS-fallback] Order already exists in DB:', existingOrder);
      return NextResponse.json({
        success: true,
        captured: true,
        alreadyProcessed: true,
        order_id: existingOrder.id,
        order_number: existingOrder.order_number,
      });
    }

    // ── 2. Fetch payments for this Razorpay order ──────────────────────────────
    const paymentsResponse = await (razorpay.orders as any).fetchPayments(razorpay_order_id);
    const payments: any[] = paymentsResponse?.items ?? [];

    console.log('[iOS-fallback] Payments for order', razorpay_order_id, ':', payments.map(p => ({ id: p.id, status: p.status })));

    const capturedPayment = payments.find((p: any) => p.status === 'captured');

    if (!capturedPayment) {
      // Payment not yet captured — tell the client to wait
      console.log('[iOS-fallback] Payment not yet captured for order', razorpay_order_id);
      return NextResponse.json({ success: false, captured: false, error: 'Payment not yet completed' });
    }

    console.log('[iOS-fallback] Payment captured:', capturedPayment.id);

    // ── 3. Fetch the Razorpay order for the authoritative amount ──────────────
    const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
    const expectedAmount = (rzpOrder as any).amount / 100; // paise → rupees

    // ── 4. Create the database order (same idempotency path as verify-payment) ─
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const dbOrderData: Record<string, any> = {
      order_number: orderNumber,
      user_id: userId || null,
      customer_name: orderPayload.customerName,
      customer_email: orderPayload.email,
      customer_phone: orderPayload.phone,
      shipping_address: orderPayload.shippingAddress,
      payment_method: orderPayload.paymentMethod || 'razorpay',
      total_amount: expectedAmount,
      discount_amount: orderPayload.discountAmount || 0,
      coupon_code: orderPayload.couponCode || null,
      final_total_after_discount: expectedAmount,
      status: 'Confirmed',
      payment_status: 'Paid',
      razorpay_order_id,
      razorpay_payment_id: capturedPayment.id,
      // No signature available in this path — store a marker
      payment_signature: 'ios-fallback-verified',
      gateway: 'razorpay',
      transaction_time: new Date().toISOString(),
    };

    let { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([dbOrderData])
      .select()
      .single();

    // Schema-cache retry (same pattern as verify-payment route)
    if (orderError && (orderError.code === 'PGRST204' || orderError.message?.includes('schema cache'))) {
      console.warn('[iOS-fallback] Schema cache error, retrying with minimal columns');
      const fallback = { ...dbOrderData };
      delete fallback.coupon_id;
      delete fallback.discount_type;
      delete fallback.discount_value;
      delete fallback.actual_discount_applied;
      delete fallback.final_total_after_discount;

      const retry = await supabase.from('orders').insert([fallback]).select().single();
      order = retry.data;
      orderError = retry.error;
    }

    if (orderError || !order) {
      console.error('[iOS-fallback] Order insert error:', orderError);
      return NextResponse.json(
        { success: false, error: orderError?.message || 'Failed to create order' },
        { status: 500 }
      );
    }

    console.log('[iOS-fallback] Order created:', order.id, orderNumber);

    // ── 5. Side-effects (items, payments, stock, cart) — best-effort ──────────
    const orderItems = items.map((item: any) => ({
      order_id: order!.id,
      product_id: item.productId || item.id,
      product_name: item.productName || item.title || 'Product',
      size: item.size || item.shirtSize || item.pantSize || item.shoeSize || 'N/A',
      color: item.color || null,
      quantity: item.quantity,
      price: item.sellingPrice ?? item.discountedPrice ?? item.price ?? 0,
    }));

    const reduceStockTasks = Promise.allSettled(
      items.map(async (item: any) => {
        const prodId = item.productId || item.id;
        const { data: productData } = await supabase
          .from('products')
          .select('category')
          .eq('id', prodId)
          .single();

        if (productData) {
          await supabase.rpc('reduce_stock', {
            p_product_id: prodId,
            p_size: item.size || item.shirtSize || item.pantSize || item.shoeSize || '',
            p_quantity: item.quantity,
            p_category: productData.category,
          });
        }
      })
    );

    await Promise.allSettled([
      supabase.from('order_items').insert(orderItems),
      supabase.from('payments').insert([{
        razorpay_payment_id: capturedPayment.id,
        razorpay_order_id,
        order_id: order.id,
        signature: 'ios-fallback-verified',
        amount: expectedAmount,
        currency: 'INR',
        status: 'Success',
      }]),
      reduceStockTasks,
      userId ? supabase.from('cart').delete().eq('user_id', userId) : Promise.resolve(),
    ]);

    console.log('[iOS-fallback] Order completed:', orderNumber);

    return NextResponse.json({
      success: true,
      captured: true,
      order_id: order.id,
      order_number: orderNumber,
      razorpay_payment_id: capturedPayment.id,
    });

  } catch (error: any) {
    console.error('[iOS-fallback] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Status check failed' },
      { status: 500 }
    );
  }
}
