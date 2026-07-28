const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('Connecting directly to 54.254.195.121:6543...');
  const client = new Client({
    host: '54.254.195.121',
    port: 6543,
    user: 'postgres.xqxnezvhrmyndpsfmrbc',
    password: 'Vyshur@m14321',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected!');

  const statements = [
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS name text;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'percentage';`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value numeric(10, 2) DEFAULT 0;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS maximum_discount numeric(10, 2);`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS minimum_purchase numeric(10, 2) DEFAULT 0;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_cart_value numeric(10, 2);`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_limit integer;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_per_user integer DEFAULT 1;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_count integer DEFAULT 0;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS start_date timestamp with time zone;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS expiry_date timestamp with time zone;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS applicable_products text[];`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS applicable_categories text[];`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS exclude_sale_products boolean DEFAULT false;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS first_order_only boolean DEFAULT false;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());`,
    `ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id text;`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code text;`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_type text;`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_value numeric(10, 2);`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS actual_discount_applied numeric(10, 2);`,
    `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS final_total_after_discount numeric(10, 2);`
  ];

  for (const stmt of statements) {
    try {
      await client.query(stmt);
      console.log('Executed:', stmt);
    } catch (e) {
      console.error('Error executing stmt:', stmt, e.message);
    }
  }

  await client.end();
  console.log('Done altering table schemas!');
}

run().catch(console.error);
