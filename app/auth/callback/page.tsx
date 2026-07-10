'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!supabase) {
      console.error('Supabase client not initialized – cannot complete OAuth flow');
      router.replace('/');
      return;
    }
    const code = searchParams.get('code');
    if (!code) {
      console.warn('No code parameter in URL');
      router.replace('/login');
      return;
    }
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ data, error }) => {
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/login');
        } else {
          console.log('Session obtained via exchangeCodeForSession:', data.session);
          router.replace('/');
        }
      })
      .catch((err) => {
        console.error('Auth callback exception:', err);
        router.replace('/login');
      });
  }, [router, searchParams]);

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
