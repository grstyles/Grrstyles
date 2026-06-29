import { createClient } from '@supabase/supabase-js';
import { config } from './config';

export const isSupabaseConfigured = (): boolean => config.isSupabaseConfigured;

const rawSupabase = config.isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseKey, {
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
      }
    })
  : null;

// Proxy wrapper to prevent "Cannot read properties of null (reading 'from')"
// and provide a clear descriptive error message if config is missing.
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    if (!rawSupabase) {
      throw new Error(
        `Supabase client not initialized. Cannot read property '${String(prop)}' of null. ` +
        `Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are configured in your Vercel project settings.`
      );
    }
    const value = Reflect.get(rawSupabase, prop);
    return typeof value === 'function' ? value.bind(rawSupabase) : value;
  }
});
