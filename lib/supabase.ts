import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/config';

/**
 * SSR-safe Supabase client for public/unauthenticated data fetching.
 *
 * Uses plain `createClient` with session persistence fully disabled so it
 * never touches `document.cookie` — making it safe in Server Components,
 * API routes, and Client Components alike.
 *
 * ⚠️  Because this client has no auth session, all RLS policies that check
 * `auth.uid()` will see null. Use this only for public reads (products,
 * banners, categories, etc. with `using (true)` RLS policies).
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
 * Auth-enabled Supabase client — browser only.
 *
 * This client persists the session in localStorage so every request carries
 * the user's JWT. Use this for any operation where RLS checks `auth.uid()`:
 * cart, wishlist, orders, profiles, admin writes, etc.
 *
 * ⚠️  This is null on the server (typeof window === 'undefined').
 *     Never import this in a Server Component or API route.
 */
export const supabaseAuth =
  typeof window !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'gr-styles-auth',
        },
      })
    : null;

/**
 * Returns the best Supabase client for the current environment:
 * - Browser  → supabaseAuth (has the user's JWT for RLS checks)
 * - Server   → supabase    (no auth, for public reads only)
 *
 * Use this in services / repositories that run in both environments.
 */
export const getClient = () =>
  (typeof window !== 'undefined' ? supabaseAuth : supabase) ?? supabase;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};