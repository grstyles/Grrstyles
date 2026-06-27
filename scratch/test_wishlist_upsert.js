import { createClient } from '@supabase/supabase-js';

let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xqxnezvhrmyndpsfmrbc.supabase.co";
url = url.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, supabaseAnonKey);

async function check() {
  const userId = '11111111-1111-1111-1111-111111111111'; // Mock user
  
  // 1. Try upsert
  const { data, error } = await supabase
    .from('wishlists')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
    .select('id')
    .single();
    
  console.log("Wishlist upsert result:", error ? error.message : "OK", data);
}

check();
