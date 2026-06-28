import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, !!session);
});

async function run() {
  console.log('Signing in...');
  const res = await supabase.auth.signInWithPassword({
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  console.log('Sign in result:', !!res.data.user);
}

run();
