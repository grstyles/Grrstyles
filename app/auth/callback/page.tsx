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

    const processAuth = async () => {
      // Wait for Supabase to process the URL hash and establish the session
      const { data: { session }, error } = await supabase!.auth.getSession();
      
      if (error || !session) {
        console.error('Error in auth callback:', error);
        router.replace('/login');
        return;
      }

      // getCurrentUser will automatically create the profile if it doesn't exist
      const user = await authService.getCurrentUser();
      
      if (user?.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/profile');
      }
    };

    processAuth();
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
