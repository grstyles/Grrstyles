import { createClient } from '@supabase/supabase-js';

let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xqxnezvhrmyndpsfmrbc.supabase.co";
url = url.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, supabaseAnonKey);

async function check() {
  const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error("Auth Error:", authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log("Logged in as:", userId);

  // Try to upsert wishlist
  const { data, error } = await supabase
    .from('wishlists')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
    .select('id')
    .single();
    
  console.log("Wishlist upsert result:", error ? error.message : "OK", data);
  
  // Try to insert a wishlist item (use some random UUID for product_id, or better, fetch one first)
  const { data: prods } = await supabase.from('products').select('id').limit(1);
  if (prods && prods.length > 0 && data) {
      const prodId = prods[0].id;
      const { data: itemData, error: itemError } = await supabase
        .from('wishlist_items')
        .upsert({ wishlist_id: data.id, product_id: prodId }, { onConflict: 'wishlist_id,product_id' })
        .select('*');
      console.log("Wishlist item upsert result:", itemError ? itemError.message : "OK", itemData);
  }
}

check();
