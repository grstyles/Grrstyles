// app/api/razorpay/create-order/route.ts
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { repo } from '@/lib/repositories';
import { calculateOrderTotals } from '@/lib/utils/shipping';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, couponCode, receipt, customerName, email, phone, shippingAddress, userId } = body;
    
    console.log('🔔 Create order request:', { 
      itemsCount: items?.length, 
      couponCode, 
      customerName,
      userId 
    });

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid items" },
        { status: 400 }
      );
    }

    // Fetch product details for pricing
    const productIds = items.map((i: any) => i.productId);
    const productPromises = productIds.map((id) => repo.products.getById(id));
    const products = await Promise.all(productPromises);
    const productMap: Record<string, any> = {};
    products.forEach((p) => {
      if (p) productMap[p.id] = p;
    });

    // Prepare items with correct database product prices
    const itemsForCalculation = items.map((item: any) => {
      const product = productMap[item.productId];
      if (!product || typeof product.sellingPrice !== 'number') {
        throw new Error(`Product price unavailable for productId ${item.productId}`);
      }
      return {
        ...product,
        id: product.id,
        title: product.name,
        discountedPrice: product.sellingPrice,
        quantity: item.quantity,
        size: item.size,
        shirtSize: item.shirtSize,
        pantSize: item.pantSize,
        shoeSize: item.shoeSize,
        color: item.color,
      };
    });

    const calculatedSubtotal = itemsForCalculation.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0);

    // Apply coupon if provided
    let discount = 0;
    if (couponCode) {
      try {
        const couponResult = await repo.coupons.apply(couponCode, { subtotal: calculatedSubtotal, productIds });
        if (couponResult.valid) {
          if (couponResult.discountType === 'percentage') {
            discount = Math.round((calculatedSubtotal * couponResult.discountValue) / 100);
          } else {
            discount = couponResult.discountValue;
          }
        }
      } catch (err) {
        console.warn('Coupon validation failed:', err);
      }
    }

    // ✅ Get shipping configuration
    const shippingCfg = await repo.shipping.getSettings();
    
    console.log("========== SHIPPING DEBUG ==========");
    console.log('Shipping Config:', JSON.stringify(shippingCfg, null, 2));
    console.log('Items for calculation:', JSON.stringify(itemsForCalculation.map(i => ({
      id: i.id,
      title: i.title,
      discountedPrice: i.discountedPrice,
      quantity: i.quantity
    })), null, 2));
    console.log('Subtotal:', calculatedSubtotal);
    console.log('Discount:', discount);

    // ✅ Calculate totals using the centralized function
    const totals = calculateOrderTotals(
      itemsForCalculation,
      {
        shippingCharge: shippingCfg.shippingCharge,
        freeShippingAbove: shippingCfg.freeShippingAbove,
        freeDelivery: shippingCfg.freeDelivery,
      },
      discount
    );

    console.log('Totals:', JSON.stringify(totals, null, 2));
    console.log("====================================");

    // ✅ Use totals.total instead of undefined finalAmount
    const finalAmount = totals.total;

    // Validate final amount
    if (finalAmount < 1) {
      console.error('❌ Invalid final amount:', finalAmount);
      return NextResponse.json(
        { error: "Invalid final amount" },
        { status: 400 }
      );
    }

    // Log the amount being sent to Razorpay
    console.log('💰 Razorpay Order Amount:', {
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      tax: totals.tax,
      finalAmount: finalAmount,
      razorpayAmountInPaise: Math.round(finalAmount * 100),
      freeDelivery: shippingCfg.freeDelivery,
      freeShippingAbove: shippingCfg.freeShippingAbove,
    });

    // Get Razorpay credentials
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log('🔑 Razorpay credentials check:', {
      hasKeyId: !!key_id,
      hasKeySecret: !!key_secret,
      keyIdPrefix: key_id ? key_id.substring(0, 8) : 'none'
    });
    
    if (!key_id || !key_secret) {
      console.error('❌ Razorpay credentials missing');
      return NextResponse.json(
        { error: 'Razorpay configuration error', details: 'Missing API keys' },
        { status: 500 }
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({ 
      key_id, 
      key_secret 
    });

    // Create order
    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: {
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        tax: totals.tax,
        discount: totals.discount,
        freeDelivery: shippingCfg.freeDelivery ? 'Yes' : 'No',
        freeShippingAbove: shippingCfg.freeShippingAbove,
      }
    });
    
    console.log('✅ Razorpay order created:', {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });

    // Return the Razorpay order
    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });
    
  } catch (error: any) {
    console.error('❌ Create order error:', error);
    console.error('Error stack:', error.stack);
    
    // Always return JSON, never HTML
    return NextResponse.json(
      { 
        error: 'Failed to create order', 
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}