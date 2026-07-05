import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { repo } from '@/lib/repositories';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, couponCode, receipt } = body;

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
      const product = await repo.products.getById(item.productId);
      if (!product) {
        console.log("❌ Product not found:", item.productId);
        return NextResponse.json(
          {
            error: "Product not found",
            productId: item.productId,
          },
          { status: 400 }
        );
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
    // Shipping logic used in frontend: Free over ₹2,000, else ₹100
    const shipping = calculatedSubtotal >= 2000 ? 0 : calculatedSubtotal > 0 ? 100 : 0;
    
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

    // Get Razorpay credentials
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error("❌ Razorpay credentials missing.");
      return NextResponse.json(
        { error: 'Razorpay is not configured properly on the server.' },
        { status: 500 }
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    // Create order
    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    // Return the order with amount in rupees (not paise) for frontend
    return NextResponse.json({
      ...order,
      amount: amount, // Send amount in rupees
    });
    
  } catch (error: any) {
    console.error('❌ Razorpay Order Creation Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create order', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}