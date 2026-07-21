import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { repo } from '@/lib/repositories';
import { calculateOrderTotals } from '@/lib/utils/shipping';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
export async function POST(req: Request) {
  try {
    const { orderPayload, cartItems, userId } = await req.json();

    if (!orderPayload || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid order data' }, { status: 400 });
    }

    if (orderPayload.paymentMethod !== 'cod') {
      return NextResponse.json({ success: false, error: 'This endpoint is for Cash on Delivery only' }, { status: 400 });
    }

    // Fetch product details for pricing
    const productIds = cartItems.map((i: any) => i.id || i.productId);
    const productPromises = productIds.map((id: string) => repo.products.getById(id));
    const products = await Promise.all(productPromises);
    const productMap: Record<string, any> = {};
    products.forEach((p) => {
      if (p) productMap[p.id] = p;
    });

    const itemsForCalculation = cartItems.map((item: any) => {
      const product = productMap[item.id || item.productId];
      if (!product || typeof product.sellingPrice !== 'number') {
        throw new Error(`Product price unavailable for productId ${item.id || item.productId}`);
      }
      return {
        price: product.mrpPrice,
        sellingPrice: product.sellingPrice,
        discountedPrice: product.sellingPrice,
        quantity: item.quantity
      };
    });

    const calculatedSubtotal = itemsForCalculation.reduce((sum: number, item: any) => sum + item.sellingPrice * item.quantity, 0);

    // Apply coupon if provided
    let discount = 0;
    if (orderPayload.couponCode) {
      try {
        const couponResult = await repo.coupons.apply(orderPayload.couponCode, { subtotal: calculatedSubtotal, productIds });
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

    // Shipping configuration — use the service-role client (bypasses RLS).
    // repo.shipping.getSettings() uses the anon key and gets filtered by RLS,
    // returning [] and falling back to hardcoded defaults.
    const { data: shippingRow, error: shippingErr } = await supabase
      .from('shipping_settings')
      .select('shipping_charge, free_shipping_above, free_delivery')
      .eq('id', 1)
      .single();

    if (shippingErr) {
      console.warn('[cod] shipping_settings query error, using safe defaults:', shippingErr.message);
    }

    const shippingCfg = {
      shippingCharge:    Number(shippingRow?.shipping_charge    ?? 0),
      freeShippingAbove: Number(shippingRow?.free_shipping_above ?? 0),
      freeDelivery:     Boolean(shippingRow?.free_delivery       ?? true),
    };

    // Calculate totals using centralized utility
    const totals = calculateOrderTotals(itemsForCalculation, shippingCfg, discount);
    const verifiedTotalAmount = totals.total;
    const verifiedDiscountAmount = totals.discount;

    const orderNumber = `GR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Insert Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId || null,
        customer_name: orderPayload.customerName,
        customer_email: orderPayload.email,
        customer_phone: orderPayload.phone,
        shipping_address: orderPayload.shippingAddress,
        payment_method: 'cod',
        total_amount: verifiedTotalAmount,
        discount_amount: verifiedDiscountAmount,
        coupon_code: orderPayload.couponCode || null,
        status: 'Pending',
        payment_status: 'Pending'
      })
      .select('id')
      .single();  

    if (orderError || !orderData) {
      console.error('Order Insert Error:', orderError);
      return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
    }

    // 2. Insert Order Items
    const orderItemsToInsert = cartItems.map((item: any) => {
      const product = productMap[item.id || item.productId];
      const verifiedPrice = product ? product.sellingPrice : (item.discountedPrice || item.price || 0);
      return {
        order_id: orderData.id,
        product_id: item.id || item.productId,
        product_name: item.title || item.productName || (product ? product.name : 'Product'),
        size: item.size || item.shirtSize || item.pantSize || item.shoeSize || 'N/A',
        color: item.color || null,
        quantity: item.quantity,
        price: verifiedPrice
      };
    });

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
    if (itemsError) {
      console.error('Order Items Insert Error:', itemsError);
    }

    // 3. Reduce Inventory
    for (const item of cartItems) {
      const { data: productData } = await supabase
        .from('products')
        .select('category')
        .eq('id', item.id || item.productId)
        .single();
        
      if (productData) {
        const { error: stockError } = await supabase.rpc('reduce_stock', {
          p_product_id: item.id || item.productId,
          p_size: item.size || item.shirtSize || item.pantSize || item.shoeSize || '',
          p_quantity: item.quantity,
          p_category: productData.category
        });
        
        if (stockError) {
          console.error('Stock Reduction Error (COD):', stockError);
        }
      }
    }

    // 4. Clear User's Cart
    if (userId) {
      await supabase.from('cart').delete().eq('user_id', userId);
    }

    return NextResponse.json({ success: true, orderNumber });

  } catch (err: any) {
    console.error('COD Order Error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
