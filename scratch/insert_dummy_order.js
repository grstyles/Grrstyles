const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const dummyOrderNumber = `DUMMY-${Date.now()}`;
  try {
    // Attempt to insert a minimal dummy order to see what columns exist and what they return
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number: dummyOrderNumber,
        customer_name: 'Dummy Customer',
        customer_email: 'dummy@example.com',
        customer_phone: '1234567890',
        shipping_address: { city: 'Dummy' },
        total_amount: 100,
        payment_method: 'COD'
      })
      .select('*')
      .single();

    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Successfully inserted dummy order. Keys/Columns in database orders table:');
      console.log(Object.keys(data));
      console.log('Full data:', data);

      // Clean up the dummy order
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', data.id);
      if (deleteError) {
        console.error('Delete error during cleanup:', deleteError);
      } else {
        console.log('Cleanup successful.');
      }
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

run();
