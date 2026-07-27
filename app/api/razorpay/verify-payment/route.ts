// app/api/razorpay/verify-payment/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { repo } from '@/lib/repositories';


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

    // [STEP 4] verify-payment API called
    console.log('[STEP 4] verify-payment API called', { razorpay_order_id, razorpay_payment_id, userId });

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

    // [STEP 5] Signature verified
    console.log('[STEP 5] Signature verified successfully');

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
    const clientAmount = Number(orderPayload.totalAmount || 0);
    
    // Log warning if there is any mismatch between client calculation and Razorpay charged amount,
    // but proceed using the authoritative Razorpay charged amount (expectedAmount).
    if (Math.abs(clientAmount - expectedAmount) > 1.0) {
      console.warn(`⚠️ Total amount mismatch. Client payload: ${clientAmount}, Razorpay Order charged: ${expectedAmount}. Using authoritative charged amount.`);
    }

    // Check if payment or order already exists (idempotency check)
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number')
      .or(`razorpay_payment_id.eq.${razorpay_payment_id},razorpay_order_id.eq.${razorpay_order_id}`)
      .maybeSingle();

    if (existingOrder) {
      console.log('[STEP 9] Existing order found in database:', existingOrder);
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already processed',
        order_id: existingOrder.id,
        order_number: existingOrder.order_number
      });
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    // 1. Insert Order into Supabase
    const calculatedSubtotal = items.reduce(
      (s: number, i: any) => s + (i.sellingPrice ?? i.discountedPrice ?? i.price ?? 0) * i.quantity,
      0
    );
    const dbOrderData = {
      order_number: orderNumber,
      user_id: userId || null,
      customer_name: orderPayload.customerName,
      customer_email: orderPayload.email,
      customer_phone: orderPayload.phone,
      shipping_address: orderPayload.shippingAddress,
      payment_method: orderPayload.paymentMethod || 'razorpay',
      total_amount: expectedAmount, // Use authoritative Razorpay charged amount
      discount_amount: orderPayload.discountAmount || 0,
      coupon_code: orderPayload.couponCode || null,
      status: 'Confirmed',
      payment_status: 'Paid',
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      payment_signature: razorpay_signature,
      gateway: 'razorpay', // Fixed: Matches database column 'gateway'
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
          error: orderError?.message || 'Failed to insert order',
          details: orderError,
        },
        { status: 500 }
      );
    }

    // [STEP 6] Order saved to database
    console.log('[STEP 6] Order saved to database successfully', { orderId: order.id, orderNumber });

    // 2. Prepare post-order creation tasks in parallel to minimize response time
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId || item.id,
      product_name: item.productName || item.title || 'Product',
      size: item.size || item.shirtSize || item.pantSize || item.shoeSize || 'N/A',
      color: item.color || null,
      quantity: item.quantity,
      price: item.sellingPrice ?? item.discountedPrice ?? item.price ?? 0
    }));

    const insertItemsTask = supabase.from('order_items').insert(orderItems);
    
    const insertPaymentTask = supabase.from('payments').insert([{
      razorpay_payment_id,
      razorpay_order_id,
      order_id: order.id,
      signature: razorpay_signature,
      amount: expectedAmount,
      currency: 'INR',
      status: 'Success'
    }]);

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
            p_category: productData.category
          });
        }
      })
    );

    const clearCartTask = userId
      ? supabase.from('cart').delete().eq('user_id', userId)
      : Promise.resolve();

    const scratchCardTask = repo.scratchCards.evaluateAndAssignForOrder({
      id: order.id,
      orderNumber,
      userId: userId || undefined,
      userEmail: orderPayload.email,
      totalAmount: expectedAmount,
    }).catch(err => console.warn('Scratch card issuance error (Razorpay):', err));

    // Execute all side-effects concurrently
    await Promise.allSettled([
      insertItemsTask,
      insertPaymentTask,
      reduceStockTasks,
      clearCartTask,
      scratchCardTask
    ]);

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