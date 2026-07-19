// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Clean URL – remove trailing slashes and /rest/v1
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseUrl = rawUrl.replace(/\/+$/, '').replace(/\/rest\/v1.*$/g, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Single Supabase client instance for client-side use
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'gr-styles-auth', // keep custom storage key
        flowType: 'pkce',
      },
    })
  : null;

/** Helper to retrieve the client (null if not configured) */
export const getClient = () => {
  if (!supabase) {
    console.error('[Supabase] Client not initialized – check URL and ANON_KEY');
    return null;
  }
  return supabase;
};

/** Check whether Supabase environment variables are set */
export const isSupabaseConfigured = (): boolean => Boolean(supabaseUrl && supabaseAnonKey);

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

// ✅ Service Role client for server-side/admin operations
// This bypasses RLS and is only for trusted backend code
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/** Helper to retrieve the admin client (null if not configured) */
export const getAdminClient = () => {
  if (!supabaseAdmin) {
    console.error('[Supabase] Admin client not initialized – check SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }
  return supabaseAdmin;
};

/** Check whether Supabase service role key is set */
export const isSupabaseAdminConfigured = (): boolean => Boolean(supabaseUrl && supabaseServiceRoleKey);

export const supabaseAuth = supabase;
export const supabaseClient = supabase;