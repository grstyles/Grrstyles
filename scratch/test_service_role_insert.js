const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const orderNumber = `TEST-${Date.now()}`;
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '1234567890',
        shipping_address: { city: 'Test' },
        total_amount: 100,
        payment_method: 'razorpay',
        status: 'Confirmed',
        payment_status: 'Paid',
        discount_amount: 0,
        coupon_code: null,
        razorpay_order_id: 'dummy_rzp_id',
        razorpay_payment_id: 'dummy_pay_id',
        payment_signature: 'dummy_sig',
        gateway: 'razorpay',
        transaction_time: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      console.error('Insert ERROR:', error);
    } else {
      console.log('Insert SUCCESS! Order ID:', data.id);
      
      // Cleanup
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', data.id);
      if (deleteError) {
        console.error('Cleanup failed:', deleteError);
      } else {
        console.log('Cleanup successful.');
      }
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

run();
