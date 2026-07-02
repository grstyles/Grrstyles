import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const input = await req.json();
    
    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If online payment, verify razorpay signature securely here again!
    if (input.paymentMethod !== 'cod') {
      const { razorpay_order_id, razorpay_payment_id, payment_signature } = input;
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!key_secret || !razorpay_order_id || !razorpay_payment_id || !payment_signature) {
        return NextResponse.json({ error: 'Missing payment verification details or server configuration' }, { status: 400 });
      }
      
      const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
        
      if (generated_signature !== payment_signature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // Insert order using admin privileges
    const orderNumber = `GR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: input.customerName,
        customer_email: input.email,
        customer_phone: input.phone,
        alternate_phone: input.alternate_phone,
        shipping_address: input.shippingAddress,
        total_amount: input.totalAmount,
        status: input.status || 'Pending',
        payment_status: input.paymentStatus || 'Pending',
        payment_method: input.paymentMethod || 'Prepaid',
        razorpay_order_id: input.razorpay_order_id,
        razorpay_payment_id: input.razorpay_payment_id,
        payment_signature: input.payment_signature,
        gateway: input.gateway,
        transaction_time: input.transaction_time,
        invoice_number: input.invoice_number,
        items: input.items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          color: item.color,
          image: item.image,
          slug: item.slug,
          sku: item.sku,
          custom_images: item.custom_images || []
        }))
      })
      .select('*')
      .single();

    if (error) throw error;
    
    // Reduce inventory after successful payment/order creation
    try {
      for (const item of input.items) {
        if (item.productId && item.size && item.quantity) {
          // Fetch current stock
          const { data: currentProduct, error: fetchError } = await supabase
            .from('products')
            .select('sizes')
            .eq('id', item.productId)
            .maybeSingle();
            
          if (!fetchError && currentProduct) {
            const sizes = currentProduct.sizes || [];
            let updated = false;
            
            const newSizes = sizes.map((s: any) => {
              if (s.size === item.size) {
                updated = true;
                return { ...s, stock: Math.max(0, s.stock - item.quantity) };
              }
              return s;
            });
            
            if (updated) {
              await supabase
                .from('products')
                .update({ sizes: newSizes })
                .eq('id', item.productId);
            }
          }
        }
      }
    } catch (invErr) {
      console.error('Failed to reduce inventory:', invErr);
      // We don't throw here to avoid failing the order response, but in a real system we might use a transaction.
    }
    
    return NextResponse.json({ orderNumber });
  } catch (err: any) {
    console.error('Secure Order Creation Error:', err);
    return NextResponse.json({ error: 'Failed to create secure order' }, { status: 500 });
  }
}
