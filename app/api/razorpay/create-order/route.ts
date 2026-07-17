import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { repo } from '@/lib/repositories';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly in this file
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, couponCode, receipt, customerName, email, phone, shippingAddress, userId } = body;
    
    console.log('🔔 Received create-order request:', { 
      itemsCount: items?.length, 
      couponCode, 
      receipt,
      customerName,
      email,
      phone,
      userId 
    });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid items" },
        { status: 400 }
      );
    }

    let calculatedSubtotal = 0;
    const productIds = [];
    const orderItems = [];

    for (const item of items) {
      let product = await repo.products.getById(item.productId);
      if (!product) {
        product = await repo.products.getBySlug(item.productId);
      }
      if (!product) {
        return NextResponse.json(
          { error: "Product not found", productId: item.productId },
          { status: 400 }
        );
      }
      
      const price = product.discountedPrice || product.price || 0;
      calculatedSubtotal += price * item.quantity;
      productIds.push(item.productId);
      
      orderItems.push({
        productId: item.productId,
        productName: product.title || product.name || 'Product',
        quantity: item.quantity,
        price: price,
        size: item.size || null,
        color: item.color || null,
      });
    }

    let calculatedDiscount = 0;
    if (couponCode) {
      const valRes = await repo.coupons.apply(couponCode, { subtotal: calculatedSubtotal, productIds });
      if (valRes.valid) {
        calculatedDiscount = valRes.discountType === 'percentage' 
          ? Math.round((calculatedSubtotal * valRes.discountValue) / 100)
          : valRes.discountValue;
      }
    }

    const tax = Math.round((calculatedSubtotal - calculatedDiscount) * 0.12);
    const shippingConfig = await repo.shipping.getSettings();
    const shipping = calculatedSubtotal >= shippingConfig.freeShippingAbove ? 0 : shippingConfig.shippingCharge;
    const finalAmount = calculatedSubtotal - calculatedDiscount + tax + shipping;

    if (finalAmount < 1) {
      return NextResponse.json(
        { error: "Invalid final amount" },
        { status: 400 }
      );
    }

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: 'Razorpay configuration error' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({ key_id, key_secret });
    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
    });
    
    console.log('✅ Razorpay order created:', order.id);

    const tempOrderData = {
      user_id: userId || '00000000-0000-0000-0000-000000000000',
      razorpay_order_id: order.id,
      customer_name: customerName || 'Customer',
      email: email || '',
      phone: phone || '',
      shipping_address: shippingAddress || {},
      subtotal: calculatedSubtotal,
      shipping_charge: shipping,
      tax: tax,
      discount: calculatedDiscount,
      grand_total: finalAmount,
      coupon_code: couponCode || null,
      items: orderItems,
    };

    const { error: tempError } = await supabase
      .from('temp_orders')
      .insert([tempOrderData]);

    if (tempError) {
      console.error('❌ Failed to store temp order:', tempError);
    } else {
      console.log('✅ Temp order stored successfully');
    }

    return NextResponse.json(order);
    
  } catch (error: any) {
    console.error('❌ Razorpay Order Error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}