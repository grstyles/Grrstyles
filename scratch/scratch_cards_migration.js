const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function runMigration() {
  console.log('--- RUNNING SCRATCH CARDS MIGRATION ---');

  const client = new Client({
    host: 'db.xqxnezvhrmyndpsfmrbc.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Vyshur@m14321',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres database!');

    const sql = `
      -- 1. Scratch Card Settings (Singleton)
      CREATE TABLE IF NOT EXISTS scratch_card_settings (
          id INT PRIMARY KEY DEFAULT 1,
          global_enabled BOOLEAN DEFAULT true,
          min_order_amount NUMERIC DEFAULT 1000,
          award_trigger TEXT DEFAULT 'on_every_eligible_order',
          allow_multiple_per_customer BOOLEAN DEFAULT true,
          cards_per_order INT DEFAULT 1,
          specific_user_ids JSONB DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT check_singleton CHECK (id = 1)
      );

      -- Insert default settings row if not present
      INSERT INTO scratch_card_settings (id, global_enabled, min_order_amount, award_trigger, allow_multiple_per_customer, cards_per_order)
      VALUES (1, true, 1000, 'on_every_eligible_order', true, 1)
      ON CONFLICT (id) DO NOTHING;

      -- 2. Scratch Cards Master Table
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

      -- 3. User Assigned Scratch Cards
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

      -- Storage bucket for scratch card images
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('scratch-cards', 'scratch-cards', true)
      ON CONFLICT (id) DO NOTHING;
    `;

    await client.query(sql);
    console.log('Tables and Bucket created successfully.');

    // Sample initial scratch card if table is empty
    const countRes = await client.query('SELECT count(*) FROM scratch_cards;');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO scratch_cards (
          title, subtitle, description, reward_type, reward_value, coupon_code, 
          winning_probability, max_global_claims, max_claims_per_user, is_active,
          bg_color, border_color, text_color, scratch_overlay_type
        ) VALUES (
          'Welcome Festive Reward', 
          'Scratch & Win Big!', 
          'Get flat discount on your next order', 
          'flat_discount', 
          200, 
          'WELCOME200', 
          1.0, 
          1000, 
          1, 
          true,
          '#1e1b4b',
          '#f59e0b',
          '#ffffff',
          'charcoal'
        );
      `);
      console.log('Sample Scratch Card inserted!');
    }

    await client.end();
    console.log('Migration completed cleanly.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
