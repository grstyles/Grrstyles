/**
 * GR STYLES – User Repository
 * ===========================
 * Provides a thin abstraction over user data and authentication.
 * In demo mode uses in‑memory MockStore + sessionStorage.
 * In production uses Supabase Auth + profiles table.
 */

import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { mockStore } from '@/lib/providers/mockStore';
import { verifyAdminCredentials } from '@/app/actions/authActions';

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

// ─── Session Helpers for Mock mode ───────────────────────────────────────────

const getSessionUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const data = sessionStorage.getItem('gr_styles_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const setSessionUser = (user: UserProfile | null) => {
  if (typeof window === 'undefined') return;
  if (user) {
    sessionStorage.setItem('gr_styles_user', JSON.stringify(user));
  } else {
    sessionStorage.removeItem('gr_styles_user');
  }
};

// ─── Mock User Repository ───────────────────────────────────────────────────

export class MockUserRepository implements IUserRepository {
  private store = mockStore;

  async getUser() {
    return getSessionUser();
  }

  async login(email: string, password?: string) {
    // Admin login path (verified securely on server)
    const isAdminValid = await verifyAdminCredentials(email, password);
    if (isAdminValid) {
      const adminUser: UserProfile = {
        id: config.adminId,
        email: email,
        fullName: 'Admin User',
        role: 'admin',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin',
      };
      setSessionUser(adminUser);
      return { success: true, user: adminUser };
    }

    // Demo Customer login path
    if (email === 'customer@grstyles.com') {
      const demoUser: UserProfile = {
        id: 'demo-customer-001',
        email: 'customer@grstyles.com',
        fullName: 'Demo Customer',
        role: 'customer',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=customer',
      };
      setSessionUser(demoUser);
      return { success: true, user: demoUser };
    }

    // Attempt custom customer login if they registered previously in mock store
    const existing = this.store.getUsers().find((u) => u.email === email);
    if (existing) {
      setSessionUser(existing);
      return { success: true, user: existing };
    }

    return { success: false, error: 'Invalid credentials. Use Demo credentials.' };
  }

  async loginWithGoogle(email?: string, name?: string, avatar?: string) {
    const targetEmail = email || 'customer@grstyles.com';
    const targetName = name || (targetEmail === 'customer@grstyles.com' ? 'Demo Customer' : targetEmail.split('@')[0]);
    const targetAvatar = avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${targetName}`;

    let user = this.store.getUsers().find((u) => u.email === targetEmail);
    if (!user) {
      // Create user automatically
      user = {
        id: `user_${Date.now()}`,
        email: targetEmail,
        fullName: targetName,
        role: 'customer',
        avatar: targetAvatar,
      };
      this.store.addUser(user);
    }
    setSessionUser(user);
    return { success: true, user };
  }

  async register(email: string, password?: string, fullName?: string, role: 'customer' | 'admin' = 'customer') {
    const existing = this.store.getUsers().find((u) => u.email === email);
    if (existing) {
      return { success: false, error: 'User already exists.' };
    }

    const user: UserProfile = {
      id: `user_${Date.now()}`,
      email,
      fullName: fullName || email.split('@')[0],
      role,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`,
    };
    this.store.addUser(user);
    setSessionUser(user);
    return { success: true, user };
  }

  async logout() {
    setSessionUser(null);
    return true;
  }

  async updateProfile(updates: Partial<Pick<UserProfile, 'fullName' | 'email'>>) {
    const currentUser = getSessionUser();
    if (!currentUser) return { success: false, error: 'No user session found.' };

    const updated = { ...currentUser, ...updates };
    setSessionUser(updated);
    this.store.updateUser(currentUser.id, updates);
    return { success: true, user: updated };
  }

  async isAdmin(userId: string) {
    const user = getSessionUser();
    return user?.id === userId && user?.role === 'admin';
  }

  async getByEmail(email: string) {
    const user = this.store.getUsers().find((u) => u.email === email);
    return user ? { ...user } : null;
  }

  async create(user: UserProfile) {
    this.store.addUser(user);
    return { ...user };
  }

  async getAll() {
    return this.store.getUsers().map((u) => ({ ...u }));
  }
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
