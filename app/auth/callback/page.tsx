'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseAuth } from '@/lib/supabase';

// ─── Spinner shared between the inner component and the Suspense fallback ─────
function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f7f5]">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}

// ─── Inner component — uses useSearchParams so MUST be inside <Suspense> ──────
//
// Next.js App Router rule: any component that calls useSearchParams() must be
// wrapped in a <Suspense> boundary. Without it:
//   1. useSearchParams() returns empty params during the server/hydration pass,
//      causing "No code parameter" to fire even when the ?code= IS in the URL.
//   2. The whole page defers to client-side rendering unpredictably.
//
// React StrictMode (dev only) runs every useEffect TWICE. The hasExchanged ref
// ensures exchangeCodeForSession() is called exactly once per page mount even in
// StrictMode, preventing the "no code" warning on the phantom second run.
function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasExchanged = useRef(false);

  useEffect(() => {
    // Guard: only run once per mount (StrictMode fires effects twice in dev)
    if (hasExchanged.current) return;

    if (!supabaseAuth) {
      console.error('Supabase auth client not initialized – cannot complete OAuth flow');
      router.replace('/');
      return;
    }

    const code = searchParams.get('code');

    if (!code) {
      // This fires legitimately only when someone navigates to /auth/callback
      // with no ?code= (e.g. direct URL visit or a misconfigured Supabase redirect URL).
      // In a real OAuth flow the code is always present here.
      console.warn('[auth/callback] No ?code= found in URL. Possible causes:\n' +
        '  1. User visited /auth/callback directly (not via OAuth).\n' +
        '  2. Supabase Redirect URL in Dashboard does not include /auth/callback.\n' +
        '     → Fix: Auth → URL Configuration → add http://localhost:3000/auth/callback');
      router.replace('/login');
      return;
    }

    // Mark as exchanged BEFORE the async call so the StrictMode second run skips
    hasExchanged.current = true;

    supabaseAuth.auth
      .exchangeCodeForSession(code)
      .then(({ data, error }) => {
        if (error) {
          console.error('[auth/callback] exchangeCodeForSession error:', error.message, error);
          router.replace('/login');
        } else {
          console.log('[auth/callback] Session established for:', data.session?.user?.email);
          router.replace('/profile');
        }
      })
      .catch((err) => {
        console.error('[auth/callback] Unexpected exception:', err);
        router.replace('/login');
      });
  }, [router, searchParams]);

  return <Spinner />;
}

// ─── Page export — wraps inner component in Suspense ─────────────────────────
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
