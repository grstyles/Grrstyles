const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

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
        payment_method: 'COD',
        status: 'Pending',
        payment_status: 'Pending',
        razorpay_order_id: 'dummy_rzp_id',
        razorpay_payment_id: 'dummy_pay_id',
        transaction_time: new Date().toISOString(),
        invoice_number: 'dummy_inv_id',
        items: []
      })
      .select('*')
      .single();

    if (error) {
      console.error('Insert error (fixed payload):', error);
    } else {
      console.log('Insert SUCCESS (fixed payload)! Order:', data);
      
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
