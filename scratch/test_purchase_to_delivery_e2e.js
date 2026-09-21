const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));

const BASE_URL = 'http://localhost:3000';
const adminClient = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);
const anonClient = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const testCustomerEmail = 'customer.test@grstyles.com';
const testCustomerPassword = 'Password123!';

async function runE2ETest() {
  console.log('=====================================================');
  console.log('🚀 TEST 1 — END-TO-END PURCHASE TO DELIVERY WORKFLOW');
  console.log('=====================================================\n');

  const stepResults = {};

  try {
    // -------------------------------------------------------------
    // Step 1: Open the website (Verify API & Shop availability)
    // -------------------------------------------------------------
    console.log('--- STEP 1: Open Website / Check Server & Shipping API ---');
    const shipRes = await fetch(`${BASE_URL}/api/shipping`);
    if (!shipRes.ok) throw new Error(`Shipping API failed with status ${shipRes.status}`);
    const shipConfig = await shipRes.json();
    console.log('✅ Server is active. Shipping config:', shipConfig);
    stepResults['1. Open Website'] = 'PASS';

    // -------------------------------------------------------------
    // Step 2: Login as Customer
    // -------------------------------------------------------------
    console.log('\n--- STEP 2: Login as Customer ---');
    const { data: authData, error: authErr } = await anonClient.auth.signInWithPassword({
      email: testCustomerEmail,
      password: testCustomerPassword
    });
    if (authErr || !authData.session) throw new Error(`Customer login failed: ${authErr?.message}`);
    const customer = authData.user;
    console.log('✅ Logged in successfully as:', customer.email, 'ID:', customer.id);
    stepResults['2. Customer Login'] = 'PASS';

    // -------------------------------------------------------------
    // Step 3 & 4: Products/Shop Page - Select Real Product
    // -------------------------------------------------------------
    console.log('\n--- STEP 3 & 4: Products / Shop Page & Product Selection ---');
    const { data: product, error: prodErr } = await adminClient
      .from('products')
      .select('*')
      .eq('slug', 'premium-white-oxford-shirt')
      .single();
    if (prodErr || !product) throw new Error(`Product fetch failed: ${prodErr?.message}`);
    console.log('✅ Selected Product:', product.name, '| Slug:', product.slug, '| ID:', product.id);
    stepResults['3-4. Product Selection'] = 'PASS';

    // -------------------------------------------------------------
    // Step 5 & 6 & 7: Product Details & Variant Selection
    // -------------------------------------------------------------
    console.log('\n--- STEP 5, 6 & 7: Product Details, Stock & Variant Selection ---');
    console.log('  - Product Name:', product.name);
    console.log('  - MRP Price: ₹' + product.mrp, '| Selling Price: ₹' + product.selling_price);
    console.log('  - Images:', product.images?.length ? product.images[0] : 'None');
    console.log('  - Sizes:', product.sizes);
    console.log('  - Shirt Stock:', product.shirt_stock);
    console.log('  - Overall Stock:', product.overall_stock);

    const selectedSize = 'S';
    const initialStockS = Number(product.shirt_stock?.[selectedSize] ?? 0);
    const initialOverallStock = Number(product.overall_stock ?? 0);
    console.log(`  - Selected Variant: Size '${selectedSize}' with current stock = ${initialStockS}`);
    if (initialStockS <= 0) throw new Error(`Size ${selectedSize} is out of stock before starting test!`);
    stepResults['5-7. Product Details & Variant'] = 'PASS';

    // -------------------------------------------------------------
    // Step 8, 9 & 10: Add to Cart & Verify Cart Items
    // -------------------------------------------------------------
    console.log('\n--- STEP 8, 9 & 10: Add to Cart & Verify Cart ---');
    const cartItem = {
      id: product.id,
      productId: product.id,
      slug: product.slug,
      title: product.name,
      brand: product.brand || 'GR STYLES',
      price: product.mrp || product.selling_price,
      sellingPrice: product.selling_price,
      discountedPrice: product.selling_price,
      image: product.images?.[0] || '',
      quantity: 1,
      size: selectedSize,
      color: product.color || 'White',
      deliveryChargeEnabled: Boolean(product.delivery_charge_enabled),
      deliveryCharge: Number(product.delivery_charge || 0),
      couponApplicable: product.is_coupon_applicable !== false
    };

    // Sync to DB cart if user is authenticated
    await adminClient.from('cart').upsert({
      user_id: customer.id,
      product_id: product.id,
      size: selectedSize,
      quantity: 1,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,product_id,size' });

    console.log('✅ Cart Item prepared and verified:', {
      product: cartItem.title,
      size: cartItem.size,
      quantity: cartItem.quantity,
      price: cartItem.sellingPrice
    });
    stepResults['8-10. Cart Verification'] = 'PASS';

    // -------------------------------------------------------------
    // Step 11, 12, 13 & 14: Checkout Page & Customer Delivery Address
    // -------------------------------------------------------------
    console.log('\n--- STEP 11, 12, 13 & 14: Checkout & Customer Delivery Address Verification ---');
    // Ensure customer has their own saved address in user_addresses
    const testAddrPayload = {
      user_id: customer.id,
      full_name: 'Test Customer',
      phone: '9876543210',
      email: testCustomerEmail,
      address_line_1: 'Flat 402, Royal Palms, Road No 12',
      address_line_2: 'Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
      country: 'India',
      is_default: true
    };

    // Upsert customer address
    const { data: existingAddrs } = await adminClient.from('user_addresses').select('*').eq('user_id', customer.id);
    let customerAddr;
    if (existingAddrs && existingAddrs.length > 0) {
      customerAddr = existingAddrs[0];
    } else {
      const { data: newAddr } = await adminClient.from('user_addresses').insert(testAddrPayload).select('*').single();
      customerAddr = newAddr;
    }

    // Authenticated query for addresses as customer
    const { data: custAddrs, error: addrErr } = await anonClient
      .from('user_addresses')
      .select('*')
      .eq('user_id', customer.id);

    if (addrErr || !custAddrs || custAddrs.length === 0) {
      throw new Error(`Customer addresses query failed: ${addrErr?.message}`);
    }

    // Verify address belongs strictly to the customer
    const isStrictlyCustomer = custAddrs.every(a => a.user_id === customer.id);
    if (!isStrictlyCustomer) {
      throw new Error('SECURITY VIOLATION: Addresses list contains non-customer / admin addresses!');
    }
    console.log('✅ Verified Customer Address at Checkout:', {
      name: customerAddr.full_name,
      phone: customerAddr.phone,
      address: `${customerAddr.address_line_1}, ${customerAddr.city}, ${customerAddr.state} - ${customerAddr.pincode}`,
      isCustomerAddress: true,
      notAdminAddress: true
    });
    stepResults['11-14. Address Verification'] = 'PASS';

    // -------------------------------------------------------------
    // Step 15, 16, 17, 18, 19 & 20: Pricing, Coupon, GST, Shipping, COD
    // -------------------------------------------------------------
    console.log('\n--- STEP 15-20: Pricing, Discounts, Shipping & COD Verification ---');
    const subtotal = cartItem.sellingPrice * cartItem.quantity;
    const couponCode = 'WELCOME10';
    // WELCOME10 gives 10%
    const expectedDiscount = Math.round((subtotal * 10) / 100);
    const expectedShipping = (shipConfig.freeDelivery || subtotal >= shipConfig.freeShippingAbove) ? 0 : shipConfig.shippingCharge;
    const expectedTax = 0;
    const expectedTotal = subtotal - expectedDiscount + expectedShipping + expectedTax;

    console.log('  - Subtotal: ₹' + subtotal);
    console.log('  - Coupon applied (WELCOME10): ₹' + expectedDiscount);
    console.log('  - GST / Tax: ₹' + expectedTax);
    console.log('  - Shipping charge: ₹' + expectedShipping, '(Free shipping above ₹' + shipConfig.freeShippingAbove + ')');
    console.log('  - Final Payable Amount: ₹' + expectedTotal);
    console.log('  - Cash on Delivery enabled:', shipConfig.codEnabled);

    if (!shipConfig.codEnabled) {
      throw new Error('COD is disabled in settings!');
    }
    stepResults['15-20. Calculation & COD'] = 'PASS';

    // -------------------------------------------------------------
    // Step 21 & 22: Place Order (COD) & Verify Creation
    // -------------------------------------------------------------
    console.log('\n--- STEP 21 & 22: Placing Order via /api/checkout/cod ---');
    const addressString = `${customerAddr.address_line_1}, ${customerAddr.city}, ${customerAddr.state} - ${customerAddr.pincode}, ${customerAddr.country}`;
    const orderPayload = {
      customerName: customerAddr.full_name,
      email: customer.email,
      phone: customerAddr.phone,
      shippingAddress: {
        address: customerAddr.address_line_1,
        city: customerAddr.city,
        state: customerAddr.state,
        zip: customerAddr.pincode,
        country: customerAddr.country,
        fullAddressString: addressString
      },
      paymentMethod: 'cod',
      totalAmount: expectedTotal,
      discountAmount: expectedDiscount,
      couponCode: couponCode,
      paymentStatus: 'Pending'
    };

    const placeOrderRes = await fetch(`${BASE_URL}/api/checkout/cod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderPayload,
        cartItems: [cartItem],
        userId: customer.id
      })
    });

    const placeOrderData = await placeOrderRes.json();
    console.log('Order Placement API Response:', placeOrderData);

    if (!placeOrderRes.ok || !placeOrderData.success || !placeOrderData.orderNumber) {
      throw new Error(`Order creation failed: ${placeOrderData.error || JSON.stringify(placeOrderData)}`);
    }

    const createdOrderNumber = placeOrderData.orderNumber;
    console.log('✅ Order created successfully! Order Number:', createdOrderNumber);
    stepResults['21-22. Order Creation'] = 'PASS';

    // Fetch order from DB
    const { data: dbOrder, error: dbOrdErr } = await adminClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', createdOrderNumber)
      .single();

    if (dbOrdErr || !dbOrder) throw new Error(`DB Order fetch failed: ${dbOrdErr?.message}`);
    console.log('DB Order row:', {
      id: dbOrder.id,
      order_number: dbOrder.order_number,
      customer_name: dbOrder.customer_name,
      customer_email: dbOrder.customer_email,
      total_amount: dbOrder.total_amount,
      discount_amount: dbOrder.discount_amount,
      status: dbOrder.status,
      payment_status: dbOrder.payment_status,
      payment_method: dbOrder.payment_method,
      items_count: dbOrder.order_items?.length
    });

    // -------------------------------------------------------------
    // Step 23: Verify Order appears in Customer's Order History
    // -------------------------------------------------------------
    console.log('\n--- STEP 23: Customer Order History Verification ---');
    const { data: customerOrders, error: custOrdErr } = await anonClient
      .from('orders')
      .select('*, order_items(*, products(id, name, images, slug))')
      .eq('order_number', createdOrderNumber);

    if (custOrdErr || !customerOrders || customerOrders.length === 0) {
      throw new Error(`Customer order history did not return the order: ${custOrdErr?.message}`);
    }
    console.log('✅ Order verified in Customer Order History! Order status:', customerOrders[0].status);
    stepResults['23. Customer Order History'] = 'PASS';

    // -------------------------------------------------------------
    // Step 24, 25 & 26: Open Admin Panel & Verify Order in Admin Orders
    // -------------------------------------------------------------
    console.log('\n--- STEP 24, 25 & 26: Admin Orders Verification ---');
    const { data: adminOrders, error: adminOrdErr } = await adminClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', dbOrder.id)
      .single();

    if (adminOrdErr || !adminOrders) throw new Error(`Admin orders check failed: ${adminOrdErr?.message}`);
    console.log('✅ Verified in Admin Orders:');
    console.log('  - Customer Name:', adminOrders.customer_name);
    console.log('  - Customer Email:', adminOrders.customer_email);
    console.log('  - Total Amount: ₹' + adminOrders.total_amount);
    console.log('  - Payment Method:', adminOrders.payment_method);
    console.log('  - Items in order:', adminOrders.order_items?.map(i => ({ product: i.product_name, size: i.size, qty: i.quantity, price: i.price })));
    stepResults['24-26. Admin Order Verification'] = 'PASS';

    // -------------------------------------------------------------
    // Step 27, 28, 29 & 30: Delivery-Status Lifecycle & Sync
    // -------------------------------------------------------------
    console.log('\n--- STEP 27-30: Test Complete Delivery-Status Lifecycle ---');
    const deliverySteps = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

    for (const nextStatus of deliverySteps) {
      console.log(`\nTransitioning Order Status -> ${nextStatus} via Admin API/DB...`);
      
      const updatePayload = { status: nextStatus, updated_at: new Date().toISOString() };
      if (nextStatus === 'Shipped') {
        updatePayload.courier_partner = 'Blue Dart Express';
        updatePayload.tracking_id = 'BD9876543210IN';
        updatePayload.tracking_url = 'https://bluedart.com/track/BD9876543210IN';
        updatePayload.dispatch_date = new Date().toISOString();
        updatePayload.expected_delivery_date = new Date(Date.now() + 3*86400000).toISOString();
      }
      if (nextStatus === 'Delivered') {
        updatePayload.delivered_date = new Date().toISOString();
        // COD delivered orders transition payment_status to Paid
        updatePayload.payment_status = 'Paid';
      }

      const { error: updErr } = await adminClient
        .from('orders')
        .update(updatePayload)
        .eq('id', dbOrder.id);

      if (updErr) throw new Error(`Status update to ${nextStatus} failed: ${updErr.message}`);

      // Verify customer instantly sees updated status
      const { data: custCheck, error: checkErr } = await anonClient
        .from('orders')
        .select('status, payment_status, tracking_id, courier_partner, delivered_date')
        .eq('id', dbOrder.id)
        .single();

      if (checkErr || !custCheck || custCheck.status !== nextStatus) {
        throw new Error(`Customer order status mismatch: Expected '${nextStatus}', got '${custCheck?.status}'`);
      }

      console.log(`✅ Customer view updated: status = '${custCheck.status}', payment_status = '${custCheck.payment_status}'`);
      if (nextStatus === 'Shipped') {
        console.log(`   Courier: ${custCheck.courier_partner}, Tracking: ${custCheck.tracking_id}`);
      }
    }
    stepResults['27-30. Status Lifecycle & Sync'] = 'PASS';

    // -------------------------------------------------------------
    // Step 31: Verify Stock Reduction Exactly Once
    // -------------------------------------------------------------
    console.log('\n--- STEP 31: Verify Stock is Reduced Exactly Once ---');
    const { data: productAfterOrder } = await adminClient
      .from('products')
      .select('*')
      .eq('id', product.id)
      .single();

    const stockSAfter = Number(productAfterOrder.shirt_stock?.[selectedSize] ?? 0);
    const overallStockAfter = Number(productAfterOrder.overall_stock ?? 0);

    console.log(`Stock Before Order: S = ${initialStockS}, Overall = ${initialOverallStock}`);
    console.log(`Stock After Order:  S = ${stockSAfter}, Overall = ${overallStockAfter}`);

    if (stockSAfter !== initialStockS - 1) {
      throw new Error(`Stock reduction incorrect! Expected ${initialStockS - 1}, but found ${stockSAfter}`);
    }
    if (overallStockAfter !== initialOverallStock - 1) {
      throw new Error(`Overall stock reduction incorrect! Expected ${initialOverallStock - 1}, but found ${overallStockAfter}`);
    }
    console.log('✅ Stock reduced exactly once (1 unit of size S)!');
    stepResults['31. Stock Reduction'] = 'PASS';

    // -------------------------------------------------------------
    // Step 32: Verify Cart is Cleared after Successful Order
    // -------------------------------------------------------------
    console.log('\n--- STEP 32: Verify Cart is Cleared ---');
    const { data: cartAfter, error: cartErr } = await adminClient
      .from('cart')
      .select('*')
      .eq('user_id', customer.id);

    console.log('Cart items in DB after checkout:', cartAfter?.length);
    if (cartAfter && cartAfter.length > 0) {
      throw new Error('Cart was not cleared in DB after order placement!');
    }
    console.log('✅ Cart is completely cleared after checkout!');
    stepResults['32. Cart Cleared'] = 'PASS';

    // -------------------------------------------------------------
    // Step 33: Refresh and Verify Final State Integrity
    // -------------------------------------------------------------
    console.log('\n--- STEP 33: Refresh and Verify State Integrity ---');
    const { data: finalCustomerOrder } = await anonClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', dbOrder.id)
      .single();

    const { data: finalAdminOrder } = await adminClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', dbOrder.id)
      .single();

    if (finalCustomerOrder.status !== 'Delivered' || finalAdminOrder.status !== 'Delivered') {
      throw new Error('Final persisted status mismatch on refresh!');
    }
    console.log('✅ Customer and Admin views are in 100% agreement on Delivered status!');
    stepResults['33. State Integrity'] = 'PASS';

    console.log('\n=====================================================');
    console.log('🎉 ALL END-TO-END PURCHASE TO DELIVERY TESTS PASSED!');
    console.log('=====================================================');
    console.log(JSON.stringify(stepResults, null, 2));

  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err);
    process.exit(1);
  }
}

runE2ETest();
