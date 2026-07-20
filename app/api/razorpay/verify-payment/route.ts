// app/api/razorpay/verify-payment/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || (() => { throw new Error('Supabase service role key not set in environment'); })()
);
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      userId,
      orderPayload,
      items
    } = body;

    console.log('📥 Verify payment request:', { razorpay_order_id, razorpay_payment_id, userId });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderPayload || !items) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return NextResponse.json(
        { success: false, error: 'Razorpay configuration error' },
        { status: 500 }
      );
    }

    // Verify Razorpay signature
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.warn('⚠️ Signature mismatch');
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Fetch the Razorpay order to validate the amount matches the previously calculated total amount
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key_id) {
      return NextResponse.json(
        { success: false, error: 'Razorpay Key ID is not configured' },
        { status: 500 }
      );
    }
    const razorpay = new Razorpay({ 
      key_id, 
      key_secret 
    });

    const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
    if (!rzpOrder) {
      return NextResponse.json(
        { success: false, error: 'Razorpay order not found' },
        { status: 400 }
      );
    }

    // Razorpay amount is in paise, convert to rupees for validation
    const expectedAmount = (rzpOrder as any).amount / 100;
    if (Math.round(orderPayload.totalAmount) !== Math.round(expectedAmount)) {
      console.warn(`⚠️ Total amount mismatch. Payload: ${orderPayload.totalAmount}, Razorpay Order: ${expectedAmount}`);
      return NextResponse.json(
        { success: false, error: 'Order amount verification failed due to mismatch' },
        { status: 400 }
      );
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, order_id')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already processed',
        order_id: existingPayment.order_id
      });
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    // 1. Insert Order
    // 1. Insert Order
const dbOrderData = {
  order_number: orderNumber,
  user_id: userId || null,
  customer_name: orderPayload.customerName,
  customer_email: orderPayload.email,
  customer_phone: orderPayload.phone,
  shipping_address: orderPayload.shippingAddress,
  payment_method: orderPayload.paymentMethod,
  total_amount: orderPayload.totalAmount,
  discount_amount: orderPayload.discountAmount || 0,
  coupon_code: orderPayload.couponCode || null,
  status: 'Confirmed',
  payment_status: 'Paid',
  razorpay_order_id: razorpay_order_id,
  razorpay_payment_id: razorpay_payment_id,
  payment_signature: razorpay_signature,
  payment_gateway: 'razorpay',
  transaction_time: new Date().toISOString()
};

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([dbOrderData])
      .select()
      .single();

    if (orderError || !order) {
  console.error("========== ORDER INSERT ERROR ==========");
  console.error(JSON.stringify(orderError, null, 2));
  console.error("Payload:", JSON.stringify(dbOrderData, null, 2));
  console.error("========================================");

  return NextResponse.json(
    {
      success: false,
      error: orderError?.message,
      details: orderError,
    },
    { status: 500 }
  );
}

    // 2. Insert Order Items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId || item.id,
      product_name: item.productName || item.title || 'Product',
      size: item.size || item.shirtSize || item.pantSize || item.shoeSize || 'N/A',
      color: item.color || null,
      quantity: item.quantity,
      price: item.price || item.discountedPrice || 0
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    
    if (itemsError) {
      console.error('Items Insert Error:', itemsError);
      // Optional: Rollback logic if needed, but since payment is verified, we should probably keep the order and flag for manual review.
    }

    // 3. Insert Payment
    const { error: paymentError } = await supabase.from('payments').insert([{
      razorpay_payment_id,
      razorpay_order_id,
      order_id: order.id,
      signature: razorpay_signature,
      amount: orderPayload.totalAmount,
      currency: 'INR',
      status: 'Success'
    }]);

    if (paymentError) {
      console.error('Payment Insert Error:', paymentError);
    }

    // 4. Reduce Inventory to prevent overselling
    for (const item of items) {
      // Determine category (it might not be passed in items, so we fetch it)
      const { data: productData } = await supabase
        .from('products')
        .select('category')
        .eq('id', item.productId || item.id)
        .single();
        
      if (productData) {
        const { error: stockError } = await supabase.rpc('reduce_stock', {
          p_product_id: item.productId || item.id,
          p_size: item.size || item.shirtSize || item.pantSize || item.shoeSize || '',
          p_quantity: item.quantity,
          p_category: productData.category
        });
        
        if (stockError) {
          console.error('Stock Reduction Error:', stockError);
        }
      }
    }

    // 5. Clear User's Cart if userId exists
    if (userId) {
      await supabase.from('cart').delete().eq('user_id', userId);
    }

    return NextResponse.json({ 
      success: true, 
      order_id: order.id,
      order_number: orderNumber
    });

  } catch (error: any) {
    console.error('❌ Verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed', details: error.message },
      { status: 500 }
    );
  }
}