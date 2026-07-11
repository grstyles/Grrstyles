// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/config';

/**
 * Public client - for unauthenticated data fetching
 * Safe for Server Components and API routes
 */
const makeClient = () =>
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;

export const supabase = makeClient();

/**
 * Auth client - browser only with session persistence
 * For authenticated operations (cart, orders, admin, etc.)
 */
export const supabaseAuth =
  typeof window !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'gr-styles-auth',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      })
    : null;

/**
 * Get the appropriate client based on environment
 * Use this in all repositories
 */
export const getClient = () => {
  // In browser, always use auth client if available
  if (typeof window !== 'undefined' && supabaseAuth) {
    return supabaseAuth;
  }
  // On server or if auth client not available, use public client
  return supabase;
};

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};