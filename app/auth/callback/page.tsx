'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authService } from '@/services/authService';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      router.replace('/');
      return;
    }
    // AuthContext will handle the session parsing and redirect
    // We just show the loading spinner here.
  }, [router]);

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
