'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService, UserProfile } from '@/services/authService';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
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

  // Load session on mount
  useEffect(() => {
    // Capture hash immediately on mount to detect OAuth redirect fallback
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const isOAuthCallback = hash.includes('access_token') || hash.includes('error_description');

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
      const { data: { subscription } } = supabase!.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            
            // If we detected an OAuth callback hash on mount and this is a SIGNED_IN event,
            // or if we are explicitly on the callback page, we should redirect the user.
            // This fixes the issue where Supabase falls back to the Site URL (root) 
            // if /auth/callback is not in the allowed Redirect URLs list.
            if (event === 'SIGNED_IN' && isOAuthCallback) {
              // Clean up the URL
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
              }
              if (currentUser?.role === 'admin') {
                router.replace('/admin');
              } else {
                router.replace('/profile');
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
