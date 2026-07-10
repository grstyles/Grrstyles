import { createBrowserSupabaseClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/config';

export const supabase = createBrowserSupabaseClient({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_ANON_KEY,
});

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};
