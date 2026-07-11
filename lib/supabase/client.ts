// BUG 7 FIX: This file previously created a SECOND Supabase browser client using
// `createBrowserSupabaseClient` from '@supabase/ssr'. Having two separate clients means
// they may use different localStorage keys or separate session caches — any component
// importing from here would see an empty session even when the user is logged in via
// the primary supabaseAuth client in lib/supabase.ts.
//
// Fix: re-export the canonical supabaseAuth singleton so the entire app shares exactly
// one browser client with one PKCE verifier store and one session cache.
export { supabaseAuth as supabase, isSupabaseConfigured } from '@/lib/supabase';
