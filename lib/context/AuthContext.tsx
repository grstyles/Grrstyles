// lib/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService, UserProfile } from '@/services/authService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  loginWithGoogle: (email?: string, name?: string, avatar?: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<boolean>;
  openAuthModal: (onSuccess?: (user?: UserProfile) => void, onClose?: () => void) => void;
  closeAuthModal: () => void;
  requireAuth: (action: (user?: UserProfile) => void, onClose?: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const pendingActionRef = useRef<((user?: UserProfile) => void) | null>(null);
  const pendingCloseRef = useRef<(() => void) | null>(null);

  const signInWithGoogle = async () => {
    try {
      const res = await authService.loginWithGoogle();
      if (!res.success) {
        console.error('Error signing in with Google:', res.error);
        throw new Error(res.error || 'Google sign-in failed');
      }
      console.log('Google sign-in initiated successfully');
    } catch (error: any) {
      console.error('Error signing in with Google:', error.message);
      throw error;
    }
  };

  useEffect(() => {
    if (pathname === '/auth/callback') {
      setLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        console.log('[AuthProvider] Initializing session...');
        setLoading(true);

        // Wait a bit for session to be ready
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const currentUser = await authService.getCurrentUser();
        console.log('[AuthProvider] Current user:', currentUser?.email || 'None');
        setUser(currentUser);
      } catch (err) {
        console.error('[AuthProvider] Failed to get user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: any, session: any) => {
          console.log('[AuthProvider] Auth event:', event, session?.user?.email);

          if (event === 'SIGNED_IN' && session?.user) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            console.log('[AuthProvider] User set:', currentUser?.email);

            if (pathname === '/login' || pathname === '/auth/callback') {
              router.replace('/');
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('[AuthProvider] User signed out');
            setUser(null);
          }
        }
      );

      return () => subscription.unsubscribe();
    }
  }, [router, pathname]);

  const login = async (email: string, password?: string) => {
    try {
      const res = await authService.login(email, password);
      if (res.success && res.user) {
        setUser(res.user);
        if (res.user.role === 'admin') {
          pendingActionRef.current = null;
          pendingCloseRef.current = null;
          setIsAuthModalOpen(false);
          router.push('/admin');
        } else {
          if (pendingActionRef.current) {
            pendingActionRef.current(res.user);
            pendingActionRef.current = null;
          }
          pendingCloseRef.current = null;
          setIsAuthModalOpen(false);
        }
      }
      return res;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to login.' };
    }
  };

  const loginWithGoogle = async (email?: string, name?: string, avatar?: string) => {
    try {
      const res = await authService.loginWithGoogle(email, name, avatar);
      if (res.success && res.user) {
        setUser(res.user);
        if (pendingActionRef.current) {
          pendingActionRef.current(res.user);
          pendingActionRef.current = null;
        }
        pendingCloseRef.current = null;
        setIsAuthModalOpen(false);
      }
      return res;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to login with Google.' };
    }
  };

  const logout = async () => {
    try {
      const success = await authService.logout();
      if (success) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('gr-styles-auth');
        }
        setUser(null);
        router.push('/');
        router.refresh();
      }
      return success;
    } catch (err) {
      console.error('Logout error:', err);
      return false;
    }
  };

  const openAuthModal = (onSuccess?: (user?: UserProfile) => void, onClose?: () => void) => {
    if (onSuccess) pendingActionRef.current = onSuccess;
    if (onClose) pendingCloseRef.current = onClose;
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    if (pendingCloseRef.current) {
      pendingCloseRef.current();
      pendingCloseRef.current = null;
    }
    pendingActionRef.current = null;
  };

  const requireAuth = React.useCallback((action: (user?: UserProfile) => void, onClose?: () => void) => {
    if (user) {
      action(user);
    } else {
      openAuthModal(action, onClose);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthModalOpen,
        loading,
        login,
        loginWithGoogle,
        signInWithGoogle,
        logout,
        openAuthModal,
        closeAuthModal,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}