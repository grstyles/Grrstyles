import { createClient } from '@supabase/supabase-js';

let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xqxnezvhrmyndpsfmrbc.supabase.co";
url = url.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, supabaseAnonKey);

async function check() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });

  const userId = authData.user.id;
  
  // Try to see if profile exists for this user
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  console.log("Admin profile:", profile);
}

check();
