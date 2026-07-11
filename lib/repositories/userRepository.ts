/**
 * GR STYLES – User Repository
 * ===========================
 * Provides a thin abstraction over user data and authentication.
 * In demo mode uses in‑memory MockStore + sessionStorage.
 * In production uses Supabase Auth + profiles table.
 */

import { config } from '@/lib/config';
// BUG 2 FIX: Import supabase (the anon client) explicitly so the `supabaseAuth || supabase`
// fallback expressions don't throw a ReferenceError when supabaseAuth is null.
import { supabase, getClient, supabaseAuth } from '@/lib/supabase';
// sb() is used for non-auth DB queries (products, profiles table reads, addresses, etc.).
const sb = () => getClient()!;

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'customer' | 'admin';
  avatar?: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt?: string;
}

function mapAddressFromDb(db: any): UserAddress {
  return {
    id: db.id,
    userId: db.user_id,
    fullName: db.full_name,
    phone: db.phone,
    email: db.email || '',
    addressLine1: db.address_line_1,
    addressLine2: db.address_line_2 || '',
    city: db.city,
    state: db.state,
    pincode: db.pincode,
    country: db.country || 'India',
    isDefault: db.is_default || false,
    createdAt: db.created_at,
  };
}

function mapAddressToDb(addr: Partial<UserAddress>): any {
  const db: any = {};
  if (addr.id !== undefined) db.id = addr.id;
  if (addr.userId !== undefined) db.user_id = addr.userId;
  if (addr.fullName !== undefined) db.full_name = addr.fullName;
  if (addr.phone !== undefined) db.phone = addr.phone;
  if (addr.email !== undefined) db.email = addr.email;
  if (addr.addressLine1 !== undefined) db.address_line_1 = addr.addressLine1;
  if (addr.addressLine2 !== undefined) db.address_line_2 = addr.addressLine2;
  if (addr.city !== undefined) db.city = addr.city;
  if (addr.state !== undefined) db.state = addr.state;
  if (addr.pincode !== undefined) db.pincode = addr.pincode;
  if (addr.country !== undefined) db.country = addr.country;
  if (addr.isDefault !== undefined) db.is_default = addr.isDefault;
  return db;
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

  /** Get all addresses for a user */
  getAddresses(userId: string): Promise<UserAddress[]>;

  /** Add a new address for a user */
  addAddress(address: Omit<UserAddress, 'id' | 'createdAt'>): Promise<UserAddress>;

  /** Update an existing address */
  updateAddress(id: string, updates: Partial<UserAddress>): Promise<UserAddress>;

  /** Delete an address */
  deleteAddress(id: string): Promise<boolean>;

  /** Set an address as default */
  setDefaultAddress(id: string, userId: string): Promise<boolean>;
}

// ─── Supabase User Repository ───────────────────────────────────────────────

export class SupabaseUserRepository implements IUserRepository {
  async getUser(): Promise<UserProfile | null> {
    if (!config.isSupabaseConfigured) return null;
    // BUG 2+3 FIX: Always use supabaseAuth for auth.getUser().
    // The anonymous `supabase` client (persistSession:false) has no stored session,
    // so it will always return null for existing/returning users.
    const authClient = supabaseAuth || supabase;
    if (!authClient) return null;
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return null;

    // Fetch details from profiles table
    let { data: profile } = await sb()
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const resolvedRole = (profile?.role || user.user_metadata?.role || 'customer') as 'customer' | 'admin';

    if (!profile) {
      // BUG 3 FIX: Use authClient (which carries the user's JWT) for the profile upsert.
      // Using the anonymous sb() client here means auth.uid() returns null and RLS
      // rejects the insert for existing users, leaving them without a profile row.
      const { data: newProfile, error } = await authClient
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || '',
          full_name: fullName,
          role: resolvedRole,
        })
        .select('*')
        .maybeSingle();

      if (!error && newProfile) {
        profile = newProfile;
      } else if (error) {
        console.warn('Profile upsert failed (non-fatal):', error.message);
      }
    }

    return {
      id: user.id,
      email: user.email || '',
      fullName: profile?.full_name || fullName,
      role: resolvedRole,
      avatar: user.user_metadata?.avatar_url || '',
    };
  }

  async login(email: string, password?: string) {
    if (!config.isSupabaseConfigured) return { success: false, error: 'Supabase not configured.' };
    // BUG 2 FIX: Use supabaseAuth directly — it has persistSession:true so the session
    // is stored in localStorage after a successful password login.
    const authClient = supabaseAuth || supabase;
    if (!authClient) return { success: false, error: 'Auth client not available.' };
    const { data, error } = await authClient.auth.signInWithPassword({
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

    // BUG 6 FIX: Use NEXT_PUBLIC_SITE_URL env var as the canonical origin fallback
    // so the redirect URL is correct even if this runs server-side.
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
    const redirectTo = `${origin}/auth/callback`;
    console.log('OAuth redirectTo:', redirectTo);

    // BUG 2 FIX: Use supabaseAuth — it stores the PKCE code verifier in localStorage.
    // The callback page reads the verifier from the same storage to complete the exchange.
    const authClient = supabaseAuth || supabase;
    if (!authClient) return { success: false, error: 'Auth client not available.' };
    const { data, error } = await authClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error('OAuth error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  async register(email: string, password?: string, fullName?: string, role: 'customer' | 'admin' = 'customer') {
    if (!config.isSupabaseConfigured) return { success: false, error: 'Supabase not configured.' };
    // BUG 2 FIX: Use supabaseAuth for signUp so the new session is persisted.
    const authClient = supabaseAuth || supabase;
    if (!authClient) return { success: false, error: 'Auth client not available.' };
    const { data, error } = await authClient.auth.signUp({
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
      // Map Supabase's raw duplicate-email error to a clear user-facing message
      const raw = error?.message || 'Signup failed.';
      const isDuplicate =
        raw.toLowerCase().includes('user already registered') ||
        raw.toLowerCase().includes('already been registered') ||
        raw.toLowerCase().includes('email already') ||
        raw.toLowerCase().includes('duplicate');
      const friendlyError = isDuplicate
        ? 'An account with this email already exists. Please log in instead.'
        : raw;
      return { success: false, error: friendlyError };
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
    // BUG 2 FIX: Use supabaseAuth for signOut so the correct stored session is cleared.
    const authClient = supabaseAuth || supabase;
    if (!authClient) return true;
    const { error } = await authClient.auth.signOut();
    return !error;
  }

  async updateProfile(updates: Partial<Pick<UserProfile, 'fullName' | 'email'>>) {
    if (!config.isSupabaseConfigured) return { success: false, error: 'Supabase not configured.' };
    const user = await this.getUser();
    if (!user) return { success: false, error: 'Not logged in.' };

    const { error } = await sb()
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
    const { data } = await sb()
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    return data?.role === 'admin';
  }

  async getByEmail(email: string) {
    if (!config.isSupabaseConfigured) return null;
    const { data } = await sb()
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
    await sb()
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
    const { data } = await sb()
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

  async getAddresses(userId: string): Promise<UserAddress[]> {
    if (!config.isSupabaseConfigured) return [];
    const { data, error } = await sb()
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapAddressFromDb);
  }

  async addAddress(address: Omit<UserAddress, 'id' | 'createdAt'>): Promise<UserAddress> {
    if (!config.isSupabaseConfigured) throw new Error('Supabase not configured.');
    if (address.isDefault) {
      await sb()
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', address.userId);
    }
    const dbPayload = mapAddressToDb(address);
    const { data, error } = await sb()
      .from('user_addresses')
      .insert(dbPayload)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to add address');
    return mapAddressFromDb(data);
  }

  async updateAddress(id: string, updates: Partial<UserAddress>): Promise<UserAddress> {
    if (!config.isSupabaseConfigured) throw new Error('Supabase not configured.');
    if (updates.isDefault && updates.userId) {
      await sb()
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', updates.userId);
    }
    const dbPayload = mapAddressToDb(updates);
    const { data, error } = await sb()
      .from('user_addresses')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update address');
    return mapAddressFromDb(data);
  }

  async deleteAddress(id: string): Promise<boolean> {
    if (!config.isSupabaseConfigured) return false;
    const { error } = await sb()
      .from('user_addresses')
      .delete()
      .eq('id', id);
    return !error;
  }

  async setDefaultAddress(id: string, userId: string): Promise<boolean> {
    if (!config.isSupabaseConfigured) return false;
    await sb()
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', userId);
    const { error } = await sb()
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  }
}
