import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { repo } from '@/lib/repositories';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, couponCode, receipt } = body;
    console.log('🔔 Received create-order request:', { itemsCount: items?.length, couponCode, receipt });

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log("❌ Invalid items:", items);
      return NextResponse.json(
        { error: "Invalid items", received: items },
        { status: 400 }
      );
    }

    // Calculate total on server
    let calculatedSubtotal = 0;
    const productIds = [];

    for (const item of items) {
    // Attempt to fetch product by ID first
    let product = await repo.products.getById(item.productId);
    if (!product) {
      console.log('❌ Product not found by ID, trying slug:', item.productId);
      // Fallback: try fetching by slug (in case productId is actually a slug)
      product = await repo.products.getBySlug(item.productId);
    }
    if (!product) {
      console.log('❌ Product still not found after slug fallback:', item.productId);
      return NextResponse.json(
        {
          error: "Product not found",
          productId: item.productId,
        },
        { status: 400 }
      );
    }
      // Stock validation based on size (if applicable)
      if (item.size) {
        const stockMap = product.shirtStock ?? product.pantStock ?? product.shoeStock ?? {};
        const available = stockMap[item.size];
        if (available === undefined) {
          return NextResponse.json(
            { error: "Invalid size for product", productId: item.productId, size: item.size },
            { status: 400 }
          );
        }
        if (available < item.quantity) {
          return NextResponse.json(
            { error: "Insufficient stock", productId: item.productId, size: item.size, available, requested: item.quantity },
            { status: 400 }
          );
        }
      }
      calculatedSubtotal += product.discountedPrice * item.quantity;
      productIds.push(item.productId);
    }

    let calculatedDiscount = 0;
    if (couponCode) {
      const valRes = await repo.coupons.apply(couponCode, { subtotal: calculatedSubtotal, productIds });
      if (valRes.valid) {
        if (valRes.discountType === 'percentage') {
          calculatedDiscount = Math.round((calculatedSubtotal * valRes.discountValue) / 100);
        } else {
          calculatedDiscount = valRes.discountValue;
        }
      }
    }

    // Apply GST (12% tax used in frontend)
    const tax = Math.round((calculatedSubtotal - calculatedDiscount) * 0.12);
    // Shipping logic used in frontend: Free over dynamic threshold, else dynamic charge
    const shippingConfig = await repo.shipping.getSettings();
    const shipping = calculatedSubtotal >= shippingConfig.freeShippingAbove ? 0 : calculatedSubtotal > 0 ? shippingConfig.shippingCharge : 0;
    
    const finalAmount = calculatedSubtotal - calculatedDiscount + tax + shipping;

    // Validate final amount
    if (finalAmount < 1) {
      console.log("❌ Final amount too low:", finalAmount);
      return NextResponse.json(
        {
          error: "Invalid final amount",
          finalAmount,
        },
        { status: 400 }
      );
    }

    const currency = 'INR';
    const amount = finalAmount;

    // Get Razorpay credentials (server‑side only)
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    // ========== RAZORPAY DEBUG ==========
    console.log("========== RAZORPAY DEBUG ==========");
    console.log("KEY ID:", key_id);
    console.log("SECRET:", key_secret);
    console.log("====================================");
    
    if (!key_id || !key_secret) {
      console.error('❌ Razorpay credentials missing.', {
        hasKeyId: !!key_id,
        hasKeySecret: !!key_secret,
      });
      return NextResponse.json(
        { 
          error: 'Razorpay configuration error', 
          details: 'Razorpay Key ID or Key Secret is missing in server environment variables.',
          hasKeyId: !!key_id,
          hasKeySecret: !!key_secret
        },
        { status: 500 }
      );
    }

    // Set order options
    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    // 16. Detailed logging before creating the Razorpay order
    console.log('🔍 Razorpay Order Creation Debug Info:', {
      keyIdPrefix: key_id ? key_id.substring(0, 8) : 'NONE',
      keyIdLength: key_id ? key_id.length : 0,
      secretExists: !!key_secret,
      secretLength: key_secret ? key_secret.length : 0,
      secretHasWhitespace: key_secret ? (key_secret.trim() !== key_secret) : false,
      secretHasQuotes: key_secret ? ((key_secret.startsWith('"') && key_secret.endsWith('"')) || (key_secret.startsWith("'") && key_secret.endsWith("'"))) : false,
      environment: process.env.NODE_ENV || 'development',
      orderOptions: options,
    });

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    // Create order
    const order = await razorpay.orders.create(options);
    
    console.log('✅ Razorpay order created successfully:', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

    // Return the order object from Razorpay directly (containing amount in paise for the checkout options)
    return NextResponse.json(order);
    
  } catch (error: any) {
    console.error('❌ Razorpay Order Creation Error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Failed to create Razorpay order due to an internal server error.';
    let errorDetails = error.message;

    if (error.statusCode) {
      statusCode = error.statusCode;
    }
    
    if (error.error && error.error.description) {
      errorMessage = `Razorpay API Error: ${error.error.description}`;
      errorDetails = error.error.code || error.message;
    }

    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails,
        code: error.error?.code || 'RAZORPAY_ERROR',
        statusCode: error.statusCode || 500,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: statusCode }
    );
  }
}