import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { repo } from '@/lib/repositories';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, couponCode, receipt } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
    }

    // Calculate total on server
    let calculatedSubtotal = 0;
    const productIds = [];

    for (const item of items) {
      const product = await repo.products.getById(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      calculatedSubtotal += product.discountedPrice * item.quantity;
      productIds.push(item.productId);
    }

    let calculatedDiscount = 0;
    if (couponCode) {
      const valRes = await repo.coupons.apply(couponCode, { subtotal: calculatedSubtotal, productIds });
      if (valRes.valid) {
        calculatedDiscount = valRes.discountValue;
        if (valRes.discountType === 'percentage') {
          calculatedDiscount = Math.round((calculatedSubtotal * valRes.discountValue) / 100);
        }
      }
    }

    // Apply GST (12% tax used in frontend)
    const tax = Math.round((calculatedSubtotal - calculatedDiscount) * 0.12);
    // Shipping logic used in frontend: Free over ₹2,000, else ₹100
    const shipping = calculatedSubtotal >= 2000 ? 0 : calculatedSubtotal > 0 ? 100 : 0;
    
    const finalAmount = calculatedSubtotal - calculatedDiscount + tax + shipping;

    if (finalAmount < 1) {
      return NextResponse.json({ error: 'Minimum order amount must be at least ₹1' }, { status: 400 });
    }

    const currency = 'INR';
    const amount = finalAmount;

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error("Razorpay credentials missing.");
      return NextResponse.json({ error: 'Razorpay is not configured properly on the server.' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Razorpay Order Creation Error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}
