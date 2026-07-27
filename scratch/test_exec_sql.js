const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testSqlEndpoint() {
  const sql = `
    CREATE TABLE IF NOT EXISTS scratch_card_settings (
        id INT PRIMARY KEY DEFAULT 1,
        global_enabled BOOLEAN DEFAULT true,
        min_order_amount NUMERIC DEFAULT 1000,
        award_trigger TEXT DEFAULT 'on_every_eligible_order',
        allow_multiple_per_customer BOOLEAN DEFAULT true,
        cards_per_order INT DEFAULT 1,
        specific_user_ids JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    INSERT INTO scratch_card_settings (id, global_enabled, min_order_amount, award_trigger, allow_multiple_per_customer, cards_per_order)
    VALUES (1, true, 1000, 'on_every_eligible_order', true, 1)
    ON CONFLICT (id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS scratch_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        subtitle TEXT,
        description TEXT,
        image_url TEXT,
        bg_color TEXT DEFAULT '#1f2937',
        border_color TEXT DEFAULT '#eab308',
        text_color TEXT DEFAULT '#ffffff',
        scratch_overlay_type TEXT DEFAULT 'charcoal',
        scratch_overlay_color TEXT DEFAULT '#2c2c2c',
        reward_type TEXT NOT NULL,
        reward_value NUMERIC DEFAULT 0,
        coupon_code TEXT,
        reward_description TEXT,
        winning_probability NUMERIC DEFAULT 1.0,
        max_global_claims INT,
        max_claims_per_user INT DEFAULT 1,
        current_global_claims INT DEFAULT 0,
        start_date TIMESTAMPTZ,
        expiry_date TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_scratch_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        user_email TEXT,
        scratch_card_id UUID REFERENCES scratch_cards(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        order_number TEXT,
        is_scratched BOOLEAN DEFAULT false,
        scratched_at TIMESTAMPTZ,
        is_claimed BOOLEAN DEFAULT false,
        claimed_at TIMESTAMPTZ,
        reward_type TEXT,
        reward_value NUMERIC,
        coupon_code TEXT,
        reward_details JSONB DEFAULT '{}'::jsonb,
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        status TEXT DEFAULT 'UNSCRATCHED'
    );
  `;

  // Try calling pg-meta or sql endpoints on Supabase
  const endpoints = [
    `${supabaseUrl}/rest/v1/rpc/exec_sql`,
    `${supabaseUrl}/pg/query`,
    `https://api.supabase.com/v1/projects/xqxnezvhrmyndpsfmrbc/database/query`
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({ query: sql, sql: sql })
      });
      console.log(`Endpoint ${ep} status:`, res.status);
      const txt = await res.text();
      console.log(`Endpoint ${ep} response:`, txt);
    } catch (err) {
      console.log(`Endpoint ${ep} err:`, err.message);
    }
  }
}

testSqlEndpoint();
