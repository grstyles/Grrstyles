const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function testCustomers() {
  console.log('Testing Supabase queries for Customers page...');

  // 1. Fetch profiles
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log('Profiles in DB:', profiles?.length, pErr ? pErr.message : '');

  // 2. Fetch orders
  const { data: orders, error: oErr } = await supabase.from('orders').select('*');
  console.log('Orders in DB:', orders?.length, oErr ? oErr.message : '');

  // 3. Fetch Auth Users (if service key available)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data: authData, error: aErr } = await supabase.auth.admin.listUsers();
    console.log('Auth Users in DB:', authData?.users?.length, aErr ? aErr.message : '');
  }

  console.log('Test completed successfully!');
}

testCustomers().catch(console.error);
