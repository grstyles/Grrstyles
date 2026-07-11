'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService, UserProfile } from '@/services/authService';
import { isSupabaseConfigured, supabaseAuth } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  loginWithGoogle: (email?: string, name?: string, avatar?: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  logout: () => Promise<boolean>;
  openAuthModal: (onSuccess?: (user?: UserProfile) => void, onClose?: () => void) => void;
  closeAuthModal: () => void;
  requireAuth: (action: (user?: UserProfile) => void, onClose?: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const pendingActionRef = useRef<((user?: UserProfile) => void) | null>(null);
  const pendingCloseRef = useRef<(() => void) | null>(null);

  // Load session on mount and listen for auth state changes
  useEffect(() => {
    const initSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to get current user session:', err);
      } finally {
        setLoading(false);
      }
    };
    initSession();

    // If Supabase is configured, listen to auth state changes
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabaseAuth!.auth.onAuthStateChange(
        async (event: any, session: any) => {
          if (session?.user) {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);

            // BUG 4 FIX: The previous code checked window.location.hash for 'access_token'
            // to detect an OAuth callback. PKCE flows use a ?code= query param — not a hash —
            // so that check always returned false and the redirect after OAuth never fired.
            //
            // Correct approach: redirect on SIGNED_IN only when the user is currently on
            // /login or /auth/callback. This handles:
            //   1. OAuth callback redirect (user arrives at /auth/callback after Google login)
            //   2. Re-login after logout (user is on /login, signs in, lands on /profile)
            //   3. Does NOT redirect on page refresh (INITIAL_SESSION event, not SIGNED_IN)
            if (event === 'SIGNED_IN') {
              const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
              if (currentPath === '/login' || currentPath === '/auth/callback') {
                if (currentUser?.role === 'admin') {
                  router.replace('/admin');
                } else {
                  router.replace('/profile');
                }
              }
            }
          } else {
            setUser(null);
          }
        }
      );
      return () => subscription.unsubscribe();
    }
  }, [router]);

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
        setUser(null);
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
        login,
        loginWithGoogle,
        logout,
        openAuthModal,
        closeAuthModal,
        requireAuth,
      }}
    >
      {!loading && children}
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
