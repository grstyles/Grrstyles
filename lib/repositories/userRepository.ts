/**
 * GR STYLES – User Repository
 * ===========================
 * Provides a thin abstraction over user data and authentication.
 * In demo mode uses in‑memory MockStore + sessionStorage.
 * In production uses Supabase Auth + profiles table.
 */

import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'customer' | 'admin';
  avatar?: string;
}

/** Public interface for user repository and authentication */
export interface IUserRepository {
  /** Get currently logged-in user profile */
  getUser(): Promise<UserProfile | null>;

  /** Login a user with email and password (mainly admin) */
  login(email: string, password?: string): Promise<{ success: boolean; error?: string; user?: UserProfile }>;

  /** Passwordless Google Login flow */
  loginWithGoogle(email?: string, name?: string, avatar?: string): Promise<{ success: boolean; error?: string; user?: UserProfile }>;

  /** Register a new user */
  register(email: string, password?: string, fullName?: string, role?: 'customer' | 'admin'): Promise<{ success: boolean; error?: string; user?: UserProfile }>;

  /** Logout current user */
  logout(): Promise<boolean>;

  /** Update user profile details */
  updateProfile(updates: Partial<Pick<UserProfile, 'fullName' | 'email'>>): Promise<{ success: boolean; error?: string; user?: UserProfile }>;

  /** Check if user is an admin */
  isAdmin(userId: string): Promise<boolean>;

  /** Get a user by email (admin lookup) */
  getByEmail(email: string): Promise<UserProfile | null>;

  /** Create a new user profile manually */
  create(user: UserProfile): Promise<UserProfile>;

  /** List all users */
  getAll(): Promise<UserProfile[]>;
}

// ─── Supabase User Repository ───────────────────────────────────────────────

export class SupabaseUserRepository implements IUserRepository {
  async getUser(): Promise<UserProfile | null> {
    if (!config.isSupabaseConfigured) return null;
    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) return null;

    // Fetch details from profiles table
    const { data: profile } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return {
      id: user.id,
      email: user.email || '',
      fullName: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role: profile?.role || 'customer',
      avatar: user.user_metadata?.avatar_url || '',
    };
  }

  async login(email: string, password?: string) {
    if (!config.isSupabaseConfigured) return { success: false, error: 'Supabase not configured.' };
    const { data, error } = await supabase!.auth.signInWithPassword({
      email,
      password: password || '',
    });
    if (error || !data.user) {
      return { success: false, error: error?.message || 'Login failed.' };
    }
    const profile = await this.getUser();
    return { success: true, user: profile || undefined };
  }

  async loginWithGoogle() {
    if (!config.isSupabaseConfigured) return { success: false, error: 'Supabase not configured.' };
    const { data, error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/checkout` : undefined,
      },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async register(email: string, password?: string, fullName?: string, role: 'customer' | 'admin' = 'customer') {
    if (!config.isSupabaseConfigured) return { success: false, error: 'Supabase not configured.' };
    const { data, error } = await supabase!.auth.signUp({
      email,
      password: password || '',
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });
    if (error || !data.user) {
      return { success: false, error: error?.message || 'Signup failed.' };
    }
    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || email,
        fullName: fullName || '',
        role,
      },
    };
  }

  async logout() {
    if (!config.isSupabaseConfigured) return true;
    const { error } = await supabase!.auth.signOut();
    return !error;
  }

  async updateProfile(updates: Partial<Pick<UserProfile, 'fullName' | 'email'>>) {
    if (!config.isSupabaseConfigured) return { success: false, error: 'Supabase not configured.' };
    const user = await this.getUser();
    if (!user) return { success: false, error: 'Not logged in.' };

    const { error } = await supabase!
      .from('profiles')
      .update({
        full_name: updates.fullName,
        email: updates.email,
      })
      .eq('id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true, user: { ...user, ...updates } };
  }

  async isAdmin(userId: string) {
    if (!config.isSupabaseConfigured) return false;
    const { data } = await supabase!
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    return data?.role === 'admin';
  }

  async getByEmail(email: string) {
    if (!config.isSupabaseConfigured) return null;
    const { data } = await supabase!
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role,
    };
  }

  async create(user: UserProfile) {
    if (!config.isSupabaseConfigured) throw new Error('Supabase not configured.');
    await supabase!
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
      });
    return user;
  }

  async getAll() {
    if (!config.isSupabaseConfigured) return [];
    const { data } = await supabase!
      .from('profiles')
      .select('*');
    if (!data) return [];
    return data.map((d: any) => ({
      id: d.id,
      email: d.email,
      fullName: d.full_name,
      role: d.role,
    }));
  }
}
