import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly in this file
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return NextResponse.json(
        { error: 'Razorpay configuration error' },
        { status: 500 }
      );
    }

    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    console.log('✅ Payment verified:', { razorpay_order_id, razorpay_payment_id });

    // Check if order already exists
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (existingOrder) {
      return NextResponse.json({ 
        success: true, 
        message: 'Order already exists',
        order_id: existingOrder.id
      });
    }

    // Get temp order
    const { data: tempOrder, error: tempError } = await supabase
      .from('temp_orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (tempError || !tempOrder) {
      return NextResponse.json(
        { error: 'Order data not found' },
        { status: 404 }
      );
    }

    // Create order
    const orderData = {
      user_id: userId || tempOrder.user_id,
      razorpay_order_id,
      razorpay_payment_id,
      order_status: 'processing',
      payment_status: 'paid',
      shipping_address: tempOrder.shipping_address || {},
      subtotal: tempOrder.subtotal || 0,
      shipping_charge: tempOrder.shipping_charge || 0,
      tax: tempOrder.tax || 0,
      discount: tempOrder.discount || 0,
      grand_total: tempOrder.grand_total || 0,
      coupon_code: tempOrder.coupon_code || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('Order error:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError.message },
        { status: 500 }
      );
    }

    // Insert order items
    if (tempOrder.items && tempOrder.items.length > 0) {
      const orderItems = tempOrder.items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId || null,
        product_name: item.productName || 'Product',
        quantity: item.quantity,
        price: item.price || 0,
        size: item.size || null,
        color: item.color || null,
        subtotal: (item.price || 0) * item.quantity,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        // Rollback: Delete the order if items fail
        await supabase.from('orders').delete().eq('id', order.id);
        console.error('Items error:', itemsError);
        return NextResponse.json(
          { error: 'Failed to create order items', details: itemsError.message },
          { status: 500 }
        );
      }
    }

    // Clear cart
    await supabase
      .from('carts')
      .delete()
      .eq('user_id', userId || tempOrder.user_id);

    // Delete temp order
    await supabase
      .from('temp_orders')
      .delete()
      .eq('razorpay_order_id', razorpay_order_id);

    return NextResponse.json({ 
      success: true, 
      order_id: order.id
    });

  } catch (error: any) {
    console.error('❌ Verification Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment', details: error.message },
      { status: 500 }
    );
  }
}