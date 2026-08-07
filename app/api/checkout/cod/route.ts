import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { repo } from '@/lib/repositories';
import { calculateOrderTotals } from '@/lib/utils/shipping';
import { validateAndCalculateCoupon } from '@/lib/utils/couponEngine';


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
        quantity: item.quantity,
        deliveryChargeEnabled: product.deliveryChargeEnabled ?? (product as any).delivery_charge_enabled ?? item.deliveryChargeEnabled ?? item.delivery_charge_enabled ?? false,
        deliveryCharge: product.deliveryCharge ?? (product as any).delivery_charge ?? item.deliveryCharge ?? item.delivery_charge ?? 0,
        couponApplicable: product.couponApplicable !== false && (product as any).is_coupon_applicable !== false && (product as any).coupon_applicable !== false && item.couponApplicable !== false,
      };
    });

    const calculatedSubtotal = itemsForCalculation.reduce((sum: number, item: any) => sum + item.sellingPrice * item.quantity, 0);
    const eligibleSubtotal = itemsForCalculation.reduce((sum: number, item: any) => {
      return item.couponApplicable !== false ? sum + item.sellingPrice * item.quantity : sum;
    }, 0);

    // Apply coupon using dual coupon engine
    let discount = 0;
    let couponAudit: {
      coupon_id?: string | null;
      coupon_code?: string | null;
      discount_type?: string | null;
      discount_value?: number | null;
      actual_discount_applied?: number | null;
      final_total_after_discount?: number | null;
    } = {};

    if (orderPayload.couponCode && cartItems.length > 0) {
      try {
        const { data: couponRow } = await supabase
          .from('coupons')
          .select('*, product_coupons(product_id)')
          .eq('code', orderPayload.couponCode.toUpperCase().trim())
          .maybeSingle();

        if (couponRow) {
          const couponObj = {
            id: couponRow.id,
            code: couponRow.code,
            name: couponRow.name,
            discountType: (couponRow.discount_type === 'flat' || couponRow.discount_type === 'fixed') ? 'fixed' : 'percentage',
            discountValue: Number(couponRow.discount_value ?? couponRow.discount ?? 0),
            maximumDiscount: couponRow.maximum_discount != null ? Number(couponRow.maximum_discount) : null,
            minimumPurchase: Number(couponRow.minimum_purchase ?? couponRow.min_order_value ?? 0),
            maxCartValue: couponRow.max_cart_value != null ? Number(couponRow.max_cart_value) : null,
            description: couponRow.description || '',
            isActive: couponRow.is_active ?? couponRow.active ?? true,
            startDate: couponRow.start_date,
            endDate: couponRow.expiry_date || couponRow.end_date,
            usageLimit: couponRow.usage_limit != null ? Number(couponRow.usage_limit) : null,
            usageCount: Number(couponRow.used_count ?? couponRow.usage_count ?? 0),
            applicableProducts: couponRow.product_coupons?.map((pc: any) => pc.product_id) || [],
            applicableCategories: couponRow.applicable_categories || [],
            firstOrderOnly: Boolean(couponRow.first_order_only),
            excludeSaleProducts: Boolean(couponRow.exclude_sale_products),
          };

          const res = validateAndCalculateCoupon(couponObj as any, itemsForCalculation, { userId });
          if (res.valid) {
            discount = res.calculatedDiscount;
            couponAudit = {
              coupon_id: couponRow.id || null,
              coupon_code: couponRow.code,
              discount_type: res.discountType,
              discount_value: res.discountValue,
              actual_discount_applied: res.calculatedDiscount,
              final_total_after_discount: res.finalTotal,
            };

            // Increment used_count on coupon
            try {
              await supabase
                .from('coupons')
                .update({ 
                  used_count: (Number(couponRow.used_count || 0) + 1),
                  usage_count: (Number(couponRow.usage_count || 0) + 1)
                })
                .eq('code', couponRow.code);
            } catch (incErr) {
              console.warn('Failed to increment coupon used_count (COD):', incErr);
            }
          }
        }
      } catch (err) {
        console.warn('Coupon validation failed:', err);
      }
    }

    // Shipping configuration — use the service-role client (bypasses RLS).
    const { data: shippingRow, error: shippingErr } = await supabase
      .from('shipping_settings')
      .select('shipping_charge, free_shipping_above, free_delivery, cod_enabled')
      .eq('id', 1)
      .single();

    if (shippingErr) {
      console.warn('[cod] shipping_settings query error, using safe defaults:', shippingErr.message);
    }

    const isCodEnabled =
      shippingRow?.cod_enabled !== undefined && shippingRow?.cod_enabled !== null
        ? Boolean(shippingRow.cod_enabled)
        : true;

    if (!isCodEnabled) {
      return NextResponse.json(
        { success: false, error: 'Cash on Delivery is currently disabled. Please choose an online payment method.' },
        { status: 400 }
      );
    }

    const shippingCfg = {
      shippingCharge:    Number(shippingRow?.shipping_charge    ?? 100),
      freeShippingAbove: Number(shippingRow?.free_shipping_above ?? 999),
      freeDelivery:     Boolean(shippingRow?.free_delivery       ?? false),
    };

    // Calculate totals using centralized utility
    const totals = calculateOrderTotals(itemsForCalculation, shippingCfg, discount);
    const verifiedTotalAmount = totals.total;
    const verifiedDiscountAmount = totals.discount;

    const orderNumber = `GR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Insert Order
    const dbOrderPayload: any = {
      order_number: orderNumber,
      user_id: userId || null,
      customer_name: orderPayload.customerName,
      customer_email: orderPayload.email,
      customer_phone: orderPayload.phone,
      shipping_address: orderPayload.shippingAddress,
      payment_method: 'cod',
      total_amount: verifiedTotalAmount,
      discount_amount: verifiedDiscountAmount,
      coupon_id: couponAudit.coupon_id || null,
      coupon_code: couponAudit.coupon_code || orderPayload.couponCode || null,
      discount_type: couponAudit.discount_type || null,
      discount_value: couponAudit.discount_value || null,
      actual_discount_applied: verifiedDiscountAmount,
      final_total_after_discount: verifiedTotalAmount,
      status: 'Pending',
      payment_status: 'Pending'
    };

    let { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(dbOrderPayload)
      .select('id')
      .single();  

    if (orderError && (orderError.code === 'PGRST204' || orderError.message?.includes('schema cache'))) {
      console.warn('Supabase schema cache error in COD checkout, retrying order insert with standard columns:', orderError.message);
      const fallbackPayload = { ...dbOrderPayload };
      delete fallbackPayload.coupon_id;
      delete fallbackPayload.discount_type;
      delete fallbackPayload.discount_value;
      delete fallbackPayload.actual_discount_applied;
      delete fallbackPayload.final_total_after_discount;

      const retryResult = await supabase
        .from('orders')
        .insert(fallbackPayload)
        .select('id')
        .single();

      orderData = retryResult.data;
      orderError = retryResult.error;
    }

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

    // 5. Evaluate and assign Scratch Card if eligible
    try {
      await repo.scratchCards.evaluateAndAssignForOrder({
        id: orderData.id,
        orderNumber,
        userId: userId || undefined,
        userEmail: orderPayload.email,
        totalAmount: verifiedTotalAmount,
      });
    } catch (scErr) {
      console.warn('Scratch card auto-issuance error (COD):', scErr);
    }

    return NextResponse.json({ success: true, orderNumber, paymentMethod: 'cod' });

  } catch (err: any) {
    console.error('COD Order Error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
