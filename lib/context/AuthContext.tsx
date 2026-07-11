'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService, UserProfile } from '@/services/authService';
import { isSupabaseConfigured, supabaseAuth, supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const pendingActionRef = useRef<((user?: UserProfile) => void) | null>(null);
  const pendingCloseRef = useRef<(() => void) | null>(null);

  // Sign in with Google OAuth
  // Delegates to authService (which uses the repository) so there is only ONE
  // code path for OAuth initiation. No prompt:consent — that forced the consent
  // screen on every login, causing repeated popups and Supabase identity conflicts.
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

  // Load session on mount and listen for auth state changes
  useEffect(() => {
    const initSession = async () => {
      try {
        // Always use authService.getCurrentUser() which handles:
        // - auth.getUser() via supabaseAuth (the session-persisting client)
        // - profile fetch/upsert by UUID (never by email)
        // This single path works for both new and returning users.
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to get current user session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initSession();

    // If Supabase is configured, listen to auth state changes
    if (isSupabaseConfigured() && supabaseAuth) {
      const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(
        async (event: any, session: any) => {
          console.log('Auth state changed:', event);
          
          if (event === 'SIGNED_IN' && session?.user) {
            // Fetch the profile (getUser() uses auth.getUser() + profiles upsert)
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);

            // Redirect after sign-in for BOTH new and existing users.
            // Previously the redirect only ran inside the if(!currentUser) branch,
            // so returning users were left on the /auth/callback spinner forever.
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
            if (currentPath === '/login' || currentPath === '/auth/callback') {
              if (currentUser?.role === 'admin') {
                router.replace('/admin');
              } else {
                router.replace('/');
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed');
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
      // Clear Supabase session
      if (supabaseAuth) {
        await supabaseAuth.auth.signOut();
      }
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gr-styles-auth');
        sessionStorage.clear();
      }
      
      const success = await authService.logout();
      if (success) {
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