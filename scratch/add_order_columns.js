const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  try {
    const columns = [
      'tracking_id text',
      'tracking_url text',
      'courier_partner text',
      'dispatch_date timestamp with time zone',
      'expected_delivery_date timestamp with time zone',
      'delivered_date timestamp with time zone',
      'payment_verified boolean default false',
      'gateway_response jsonb',
    ];

    for (const col of columns) {
      const colName = col.split(' ')[0];
      const { error } = await supabase.rpc('execute_sql', {
        query: `ALTER TABLE orders ADD COLUMN IF NOT EXISTS ${col};`
      });
      if (error) {
        console.error(`Failed to add column ${colName}:`, error);
      } else {
        console.log(`Added column ${colName}`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
