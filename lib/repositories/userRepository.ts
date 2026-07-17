// services/userRepository.ts
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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

export interface IUserRepository {
  getUser(): Promise<UserProfile | null>;
  login(email: string, password?: string): Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  loginWithGoogle(): Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  register(email: string, password?: string, fullName?: string, role?: 'customer' | 'admin'): Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  logout(): Promise<boolean>;
  updateProfile(updates: Partial<Pick<UserProfile, 'fullName' | 'email'>>): Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  isAdmin(userId: string): Promise<boolean>;
  getByEmail(email: string): Promise<UserProfile | null>;
  create(user: UserProfile): Promise<UserProfile>;
  getAll(): Promise<UserProfile[]>;
  getAddresses(userId: string): Promise<UserAddress[]>;
  addAddress(address: Omit<UserAddress, 'id' | 'createdAt'>): Promise<UserAddress>;
  updateAddress(id: string, updates: Partial<UserAddress>): Promise<UserAddress>;
  deleteAddress(id: string): Promise<boolean>;
  setDefaultAddress(id: string, userId: string): Promise<boolean>;
}

export class SupabaseUserRepository implements IUserRepository {
private getAuthClient() {
    // Supabase client is initialized when configuration is present.
    // Cast to any to avoid nullability concerns; callers guard with isSupabaseConfigured.
    return supabase as any;
  }

// Refactored buildUserProfile: ensure id and email uniqueness without conflicts
private async buildUserProfile(user: any, authClient: any): Promise<UserProfile | null> {
  try {
    // 1. Try to fetch profile by Supabase auth user ID
    const { data: profileById } = await authClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileById) {
      return {
        id: user.id,
        email: user.email ?? '',
        fullName: profileById.full_name ?? user.email?.split('@')[0] ?? 'User',
        role: profileById.role ?? 'customer',
        avatar: profileById.avatar_url ?? user.user_metadata?.avatar_url ?? '',
      };
    }

    // 2. If not found by ID, check if a profile already exists for this email
    if (user.email) {
      const { data: profileByEmail } = await authClient
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (profileByEmail) {
        // Existing profile with same email – reuse it (id may differ)
        return {
          id: profileByEmail.id,
          email: profileByEmail.email,
          fullName: profileByEmail.full_name ?? user.email.split('@')[0],
          role: profileByEmail.role ?? 'customer',
          avatar: profileByEmail.avatar_url ?? user.user_metadata?.avatar_url ?? '',
        };
      }
    }

    // 3. No existing profile – create a new one (idempotent)
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User';
    const { data: newProfile, error } = await authClient
      .from('profiles')
      .insert([
        {
          id: user.id,
          email: user.email ?? '',
          full_name: fullName,
          role: 'customer',
          avatar_url: user.user_metadata?.avatar_url || '',
        },
      ])
      .select('*')
      .single();

    if (error) {
      console.warn('[buildUserProfile] Insert error', error.message);
    }

    if (newProfile) {
      return {
        id: newProfile.id,
        email: newProfile.email ?? '',
        fullName: newProfile.full_name ?? fullName,
        role: newProfile.role ?? 'customer',
        avatar: newProfile.avatar_url ?? '',
      };
    }

    // Fallback – return minimal profile
    return {
      id: user.id,
      email: user.email ?? '',
      fullName,
      role: 'customer',
      avatar: '',
    };
  } catch (error) {
    console.error('[buildUserProfile] Error:', error);
    return null;
  }
}

  async getUser(): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) {
      console.log('[getUser] Supabase not configured');
      return null;
    }

    const authClient = this.getAuthClient();
    if (!authClient) {
      console.log('[getUser] No auth client');
      return null;
    }

    try {
      console.log('[getUser] Getting user...');
      
      const { data: { session } } = await authClient.auth.getSession();
      if (!session) {
        console.log('[getUser] No session');
        return null;
      }

      const { data: { user }, error: userError } = await authClient.auth.getUser();
      
      if (userError || !user) {
        console.error('[getUser] Error:', userError?.message);
        return null;
      }

      console.log('[getUser] User found:', user.email);
      return await this.buildUserProfile(user, authClient);
    } catch (error) {
      console.error('[getUser] Error:', error);
      return null;
    }
  }

  async login(email: string, password?: string) {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured.' };
    }

    const authClient = this.getAuthClient();
    if (!authClient) {
      return { success: false, error: 'Auth client not available.' };
    }

    try {
      const { data, error } = await authClient.auth.signInWithPassword({
        email,
        password: password || '',
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Login failed.' };
      }

      const profile = await this.getUser();
      return { success: true, user: profile || undefined };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed.' };
    }
  }

  async loginWithGoogle() {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured.' };
    }

    const authClient = this.getAuthClient();
    if (!authClient) {
      return { success: false, error: 'Auth client not available.' };
    }

    const origin = typeof window !== 'undefined'
      ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL || '');
    const redirectTo = `${origin}/auth/callback`;
    
    console.log('[loginWithGoogle] Redirect URL:', redirectTo);

    try {
      const { data, error } = await authClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error('[loginWithGoogle] OAuth error:', error);
        return { success: false, error: error.message };
      }

      console.log('[loginWithGoogle] OAuth initiated');
      return { success: true };
    } catch (error: any) {
      console.error('[loginWithGoogle] Error:', error);
      return { success: false, error: error.message || 'Google sign-in failed.' };
    }
  }

  async register(email: string, password?: string, fullName?: string, role: 'customer' | 'admin' = 'customer') {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured.' };
    }

    const authClient = this.getAuthClient();
    if (!authClient) {
      return { success: false, error: 'Auth client not available.' };
    }

    try {
      const { data, error } = await authClient.auth.signUp({
        email,
        password: password || '',
        options: {
          data: { full_name: fullName, role },
        },
      });

      if (error) {
        const isDuplicate = error.message?.toLowerCase().includes('user already registered');
        return {
          success: false,
          error: isDuplicate ? 'An account with this email already exists.' : error.message,
        };
      }

      if (!data.user) {
        return { success: false, error: 'No user returned.' };
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
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed.' };
    }
  }

  async logout() {
    if (!isSupabaseConfigured()) return true;
    const authClient = this.getAuthClient();
    if (!authClient) return true;
    try {
      const { error } = await authClient.auth.signOut();
      return !error;
    } catch {
      return false;
    }
  }

  async updateProfile(updates: Partial<Pick<UserProfile, 'fullName' | 'email'>>) {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase not configured.' };
    }

    const user = await this.getUser();
    if (!user) {
      return { success: false, error: 'Not logged in.' };
    }

    const authClient = this.getAuthClient();
    if (!authClient) {
      return { success: false, error: 'Auth client not available.' };
    }

    try {
      const { error } = await authClient
        .from('profiles')
        .update({
          full_name: updates.fullName,
          email: updates.email,
        })
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: { ...user, ...updates } };
    } catch (error: any) {
      return { success: false, error: error.message || 'Update failed.' };
    }
  }

  async isAdmin(userId: string) {
    if (!isSupabaseConfigured()) return false;
    const authClient = this.getAuthClient();
    if (!authClient) return false;
    try {
      const { data } = await authClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      return data?.role === 'admin';
    } catch {
      return false;
    }
  }

  async getByEmail(email: string) {
    if (!isSupabaseConfigured()) return null;
    const authClient = this.getAuthClient();
    if (!authClient) return null;
    try {
      const { data } = await authClient
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
    } catch {
      return null;
    }
  }

  async create(user: UserProfile) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured.');
    const authClient = this.getAuthClient();
    if (!authClient) throw new Error('Auth client not available.');
    await authClient
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
    if (!isSupabaseConfigured()) return [];
    const authClient = this.getAuthClient();
    if (!authClient) return [];
    try {
      const { data } = await authClient.from('profiles').select('*');
      if (!data) return [];
      return data.map((d: any) => ({
        id: d.id,
        email: d.email,
        fullName: d.full_name,
        role: d.role,
      }));
    } catch {
      return [];
    }
  }

  async getAddresses(userId: string): Promise<UserAddress[]> {
    if (!isSupabaseConfigured()) return [];
    const authClient = this.getAuthClient();
    if (!authClient) return [];
    try {
      const { data, error } = await authClient
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map((db: any) => ({
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
      }));
    } catch {
      return [];
    }
  }

  async addAddress(address: Omit<UserAddress, 'id' | 'createdAt'>): Promise<UserAddress> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured.');
    const authClient = this.getAuthClient();
    if (!authClient) throw new Error('Auth client not available.');

    if (address.isDefault) {
      await authClient
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', address.userId);
    }

    const dbPayload: any = {
      user_id: address.userId,
      full_name: address.fullName,
      phone: address.phone,
      email: address.email,
      address_line_1: address.addressLine1,
      address_line_2: address.addressLine2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      is_default: address.isDefault,
    };

    const { data, error } = await authClient
      .from('user_addresses')
      .insert(dbPayload)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to add address');
    
    return {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      phone: data.phone,
      email: data.email || '',
      addressLine1: data.address_line_1,
      addressLine2: data.address_line_2 || '',
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      country: data.country || 'India',
      isDefault: data.is_default || false,
      createdAt: data.created_at,
    };
  }

  async updateAddress(id: string, updates: Partial<UserAddress>): Promise<UserAddress> {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured.');
    const authClient = this.getAuthClient();
    if (!authClient) throw new Error('Auth client not available.');

    if (updates.isDefault && updates.userId) {
      await authClient
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', updates.userId);
    }

    const dbPayload: any = {};
    if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName;
    if (updates.phone !== undefined) dbPayload.phone = updates.phone;
    if (updates.email !== undefined) dbPayload.email = updates.email;
    if (updates.addressLine1 !== undefined) dbPayload.address_line_1 = updates.addressLine1;
    if (updates.addressLine2 !== undefined) dbPayload.address_line_2 = updates.addressLine2;
    if (updates.city !== undefined) dbPayload.city = updates.city;
    if (updates.state !== undefined) dbPayload.state = updates.state;
    if (updates.pincode !== undefined) dbPayload.pincode = updates.pincode;
    if (updates.country !== undefined) dbPayload.country = updates.country;
    if (updates.isDefault !== undefined) dbPayload.is_default = updates.isDefault;

    const { data, error } = await authClient
      .from('user_addresses')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to update address');
    
    return {
      id: data.id,
      userId: data.user_id,
      fullName: data.full_name,
      phone: data.phone,
      email: data.email || '',
      addressLine1: data.address_line_1,
      addressLine2: data.address_line_2 || '',
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      country: data.country || 'India',
      isDefault: data.is_default || false,
      createdAt: data.created_at,
    };
  }

  async deleteAddress(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const authClient = this.getAuthClient();
    if (!authClient) return false;
    try {
      const { error } = await authClient
        .from('user_addresses')
        .delete()
        .eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  async setDefaultAddress(id: string, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const authClient = this.getAuthClient();
    if (!authClient) return false;
    try {
      await authClient
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
      const { error } = await authClient
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', userId);
      return !error;
    } catch {
      return false;
    }
  }
}

