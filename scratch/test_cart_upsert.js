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

  const userId = authData.user.id;
  
  const { data: cartData } = await supabase
    .from('carts')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
    .select('id')
    .single();
    
  const { data: prods } = await supabase.from('products').select('id').limit(1);
  if (prods && prods.length > 0 && cartData) {
      const prodId = prods[0].id;
      const { data: itemData, error: itemError } = await supabase
        .from('cart_items')
        .upsert({ 
          cart_id: cartData.id, 
          product_id: prodId,
          size: 'One Size',
          quantity: 1
        }, { onConflict: 'cart_id,product_id,size' })
        .select('*');
      console.log("Cart item upsert result:", itemError ? itemError.message : "OK", itemData);
  }
}

check();
