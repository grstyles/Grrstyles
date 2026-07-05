import { createClient } from '@supabase/supabase-js';

let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xqxnezvhrmyndpsfmrbc.supabase.co";
url = url.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('coupons').select('*').limit(1);
  if (error) {
     console.error(error);
  } else if (data.length > 0) {
     console.log(Object.keys(data[0]));
  } else {
     // No data, insert dummy and rollback? Or just get schema via PostgREST OpenAPI
     const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}?apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
     const json = await res.json();
     console.log(json.definitions.coupons.properties);
  }
}

check();
