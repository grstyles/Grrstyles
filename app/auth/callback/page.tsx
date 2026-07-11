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

    const client = supabase;
    if (!client) {
      router.replace('/login?error=no_client');
      return;
    }

    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('[auth/callback] Code exists:', !!code);
    console.log('[auth/callback] Error param:', errorParam);

    // Handle OAuth errors
    if (errorParam) {
      console.error('[auth/callback] OAuth Error:', errorParam, errorDescription || '');
      router.replace(`/login?error=${encodeURIComponent(errorParam)}`);
      return;
    }

    // If no code, check for existing session
    if (!code) {
      client.auth.getSession()
        .then(({ data: { session } }) => {
          if (session) {
            console.log('[auth/callback] ✅ Already have session!');
            router.replace('/');
          } else {
            router.replace('/login?error=no_code');
          }
        })
        .catch(() => {
          router.replace('/login?error=no_code');
        });
      return;
    }

    console.log('[auth/callback] Exchanging code...');

    client.auth
      .exchangeCodeForSession(code)
      .then(({ data, error }) => {
        if (error) {
          // ✅ Log as warning instead of error since we have recovery
          console.warn('[auth/callback] Exchange warning:', error.message);
          
          // Try recovery from localStorage
          if (error.message?.includes('PKCE')) {
            console.log('[auth/callback] PKCE warning, attempting recovery...');
            try {
              const stored = localStorage.getItem('gr-styles-auth');
              if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed?.access_token) {
                  client.auth.setSession({
                    access_token: parsed.access_token,
                    refresh_token: parsed.refresh_token || '',
                  }).then(() => {
                    console.log('[auth/callback] ✅ Session recovered from localStorage!');
                    router.replace('/');
                  }).catch(() => {
                    router.replace('/login?error=recovery_failed');
                  });
                  return;
                }
              }
            } catch (e) {
              console.error('[auth/callback] Recovery error:', e);
            }
          }
          
          router.replace(`/login?error=${encodeURIComponent(error.message || 'exchange_failed')}`);
          return;
        }

        console.log('[auth/callback] ✅ Session established!');
        console.log('[auth/callback] User:', data.session?.user?.email);
        
        router.replace('/');
        router.refresh();
      })
      .catch((err) => {
        console.error('[auth/callback] Error:', err);
        router.replace('/login?error=unexpected');
      });
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