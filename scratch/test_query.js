import { createClient } from '@supabase/supabase-js';

let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xqxnezvhrmyndpsfmrbc.supabase.co";
url = url.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('wishlist_items').select(`
          product_id,
          products!inner (id)
        `).limit(1);
  console.log("Wishlist Items Query 1:", error ? error.message : "OK", data);
  
  const { data: d2, error: e2 } = await supabase.from('wishlist_items').select(`
          products (product_id, id)
        `).limit(1);
  console.log("Wishlist Items Query 2 (Current Code):", e2 ? e2.message : "OK", d2);
}

check();
