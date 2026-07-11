// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// ✅ Single client for all uses
export const supabase = 
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'gr-styles-auth',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          flowType: 'pkce',
        },
      })
    : null;

export const supabaseClient = supabase;
export const supabaseAuth = supabase;

export const getClient = () => supabase;

// ✅ IMPORTANT: This function must exist and be exported
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

export { supabaseUrl, supabaseAnonKey };