'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authService } from '@/services/authService';

export default function AuthCallbackPage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      router.replace('/');
      return;
    }

    console.log("Current Origin:", typeof window !== 'undefined' ? window.location.origin : 'unknown');

    const code = searchParams.get('code');
    if (code) {
      // PKCE Flow
      supabase.auth.exchangeCodeForSession(code)
        .then(({ data, error }: { data: any, error: any }) => {
          if (error) {
            console.error("Auth exchange error:", error);
            router.replace('/login');
          } else {
            console.log("Exchanged session successfully:", data.session);
            router.replace('/');
          }
        })
        .catch((err: any) => {
          console.error("Auth exchange exception:", err);
          router.replace('/login');
        });
    } else {
      // Implicit flow fallback
      supabase.auth.getSession().then(({ data, error }: { data: any, error: any }) => {
        if (data?.session) {
          console.log("Session found directly:", data.session);
          router.replace('/');
        } else {
          // It might be handled by AuthProvider's onAuthStateChange event in the background,
          // but we shouldn't stay on the callback page forever.
          setTimeout(() => {
            router.replace('/');
          }, 1500);
        }
      });
    }
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
