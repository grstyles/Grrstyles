import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON request body', details: 'The request body must be valid JSON.' },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters', 
          details: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required.',
          received: { razorpay_order_id: !!razorpay_order_id, razorpay_payment_id: !!razorpay_payment_id, razorpay_signature: !!razorpay_signature }
        },
        { status: 400 }
      );
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      console.error("❌ Razorpay secret missing on the server.");
      return NextResponse.json(
        { error: 'Razorpay configuration error', details: 'Razorpay Key Secret is missing in server environment variables.' },
        { status: 500 }
      );
    }

    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.warn('⚠️ Razorpay signature mismatch:', {
        received: razorpay_signature,
        generated: generated_signature
      });
      return NextResponse.json(
        { 
          error: 'Payment verification failed', 
          details: 'The generated signature does not match the received payment signature. This could be due to a wrong RAZORPAY_KEY_SECRET, or tampered payload.' 
        },
        { status: 400 }
      );
    }

    console.log('✅ Razorpay payment verified successfully:', { razorpay_order_id, razorpay_payment_id });
    return NextResponse.json({ 
      success: true, 
      message: 'Payment verified successfully',
      razorpay_order_id,
      razorpay_payment_id
    });
  } catch (error: any) {
    console.error('❌ Razorpay Verification Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify payment due to server error', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
