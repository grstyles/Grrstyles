// app/auth/callback/page.tsx
'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f7f5]">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase">Completing sign in...</p>
      </div>
    </div>
  );
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      const client = supabase;
      if (!client) {
        console.error('[auth/callback] Complete Error Details:', {
          message: 'Supabase client instance not available',
          code: 'NO_CLIENT',
          stack: new Error().stack,
          details: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or invalid.',
          hint: 'Check .env.local configuration file.',
        });
        router.replace('/login?error=no_client');
        return;
      }

      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');
      const errorCode = searchParams.get('error_code');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth errors returned by Supabase
      if (errorParam) {
        console.error('[auth/callback] Complete OAuth Error Details:', {
          message: errorDescription || errorParam,
          code: errorCode || errorParam,
          stack: new Error().stack,
          details: searchParams.toString(),
          hint: 'Verify Supabase OAuth redirect URL, Google Cloud credentials, and database triggers.',
        });
        const desc = errorDescription ? `&error_description=${encodeURIComponent(errorDescription)}` : '';
        router.replace(`/login?error=${encodeURIComponent(errorParam)}${desc}`);
        return;
      }

      // Check whether a valid session already exists before exchanging code
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session) {
          console.log('[auth/callback] Existing session found');
          console.log('[auth/callback] Redirecting user');
          router.replace('/');
          router.refresh();
          return;
        }
      } catch (e) {
        // Ignore session lookup error and proceed
      }

      // Only call exchangeCodeForSession if URL contains a code parameter
      if (!code) {
        console.error('[auth/callback] Complete Error Details:', {
          message: 'No authorization code or session found in callback URL',
          code: 'NO_CODE',
          stack: new Error().stack,
          details: searchParams.toString(),
          hint: 'User might have accessed /auth/callback directly or OAuth flow was interrupted.',
        });
        router.replace('/login?error=no_code');
        return;
      }

      console.log('[auth/callback] Exchanging OAuth code');

      try {
        const { data, error } = await client.auth.exchangeCodeForSession(code);

        if (error) {
          // If error occurs but a valid session exists, ignore the error
          const { data: { session: checkSession } } = await client.auth.getSession().catch(() => ({ data: { session: null } }));
          if (checkSession) {
            console.log('[auth/callback] Existing session found');
            console.log('[auth/callback] Redirecting user');
            router.replace('/');
            router.refresh();
            return;
          }

          const isExpectedCase =
            error.message?.includes('code has already been used') ||
            error.message?.includes('Flow state not found') ||
            error.message?.includes('PKCE');

          if (!isExpectedCase) {
            console.error('[auth/callback] Complete Exchange Code Error Details:', {
              message: error.message,
              code: (error as any).code || (error as any).status || 'EXCHANGE_FAILED',
              stack: error.stack || new Error().stack,
              details: (error as any).details || error,
              hint: (error as any).hint || 'Ensure PKCE code verifier cookie or storage key matches.',
            });
          }

          // Attempt recovery from local storage if PKCE verifier failed
          if (error.message?.includes('PKCE')) {
            try {
              const stored = localStorage.getItem('gr-styles-auth');
              if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.access_token) {
                  await client.auth.setSession({
                    access_token: parsed.access_token,
                    refresh_token: parsed.refresh_token || '',
                  });
                  console.log('[auth/callback] Existing session found');
                  console.log('[auth/callback] Redirecting user');
                  router.replace('/');
                  router.refresh();
                  return;
                }
              }
            } catch (e) {
              // Recovery failed
            }
          }

          router.replace(`/login?error=${encodeURIComponent(error.message || 'exchange_failed')}`);
          return;
        }

        console.log('[auth/callback] Exchange successful');
        console.log('[auth/callback] Redirecting user');
        router.replace('/');
        router.refresh();
      } catch (err: any) {
        const { data: { session: fallbackSession } } = await client.auth.getSession().catch(() => ({ data: { session: null } }));
        if (fallbackSession) {
          console.log('[auth/callback] Existing session found');
          console.log('[auth/callback] Redirecting user');
          router.replace('/');
          router.refresh();
          return;
        }

        console.error('[auth/callback] Complete Error Details:', {
          message: err.message || 'Unexpected exception during code exchange',
          code: err.code || 'UNEXPECTED_ERROR',
          stack: err.stack || new Error().stack,
          details: err,
          hint: 'Check network logs and server logs.',
        });
        router.replace('/login?error=unexpected');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return <Spinner />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AuthCallbackInner />
    </Suspense>
  );
}