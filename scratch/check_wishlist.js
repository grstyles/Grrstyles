import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xqxnezvhrmyndpsfmrbc.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.log("No anon key found.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('wishlist_items').select('*').limit(1);
  console.log("Wishlist Items Error:", error);
  console.log("Wishlist Items Data:", data);
  
  const { data: d2, error: e2 } = await supabase.from('wishlist_items').select('product_id').limit(1);
  console.log("wishlist_items.product_id Check:", e2 ? e2.message : "OK");
  
  const { data: d3, error: e3 } = await supabase.from('products').select('id, product_id').limit(1);
  console.log("products Check:", e3 ? e3.message : "OK", d3);
}

check();
