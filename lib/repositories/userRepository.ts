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
        // Existing profile with same email – reuse details while ensuring user.id matches session auth.uid()
        return {
          id: user.id,
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
      .upsert(
        [{
          id: user.id,
          email: user.email ?? '',
          full_name: fullName,
          role: 'customer',
          avatar_url: user.user_metadata?.avatar_url || '',
        }],
        { onConflict: 'id', ignoreDuplicates: false }
      )
      .select('*')
      .single();

    if (error) {
      console.warn('[buildUserProfile] Upsert error', error.message);
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
        const msg = userError?.message || '';
        const isJwtError = msg.toLowerCase().includes('jwt') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('token');
        
        if (isJwtError) {
          console.warn('[getUser] Stale or expired token detected. Clearing local session.');
          try {
            await authClient.auth.signOut({ scope: 'local' });
          } catch (e) {
            // Ignore signout error on expired session
          }
        } else if (userError) {
          console.warn('[getUser] Could not fetch user:', msg);
        }
        return null;
      }

      console.log('[getUser] User found:', user.email);
      return await this.buildUserProfile(user, authClient);
    } catch (error: any) {
      console.warn('[getUser] Exception:', error?.message || error);
      return null;
    }
  }

  async login(email: string, password?: string) {
    if (!isSupabaseConfigured()) {
      console.error('[SupabaseUserRepository.login] Supabase not configured.');
      return { success: false, error: 'Supabase not configured.' };
    }

    const authClient = this.getAuthClient();
    if (!authClient) {
      console.error('[SupabaseUserRepository.login] Auth client not available.');
      return { success: false, error: 'Auth client not available.' };
    }

    try {
      const maskedPassword = password ? `${'*'.repeat(Math.max(0, password.length - 2))}${password.slice(-2)}` : '[empty]';
      console.log(`[SupabaseUserRepository.login] Attempting login for email: "${email}", password masked: "${maskedPassword}"`);

      const { data, error } = await authClient.auth.signInWithPassword({
        email,
        password: password || '',
      });

      console.log('[SupabaseUserRepository.login] Supabase response:', {
        hasData: !!data,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        hasSession: !!data?.session,
        errorCode: (error as any)?.code,
        errorMessage: error?.message,
        status: (error as any)?.status,
      });

      if (error || !data.user) {
        const rawMessage = error?.message || 'Login failed.';
        const errCode = (error as any)?.code || '';

        if (errCode === 'email_not_confirmed' || rawMessage.toLowerCase().includes('email not confirmed')) {
          return {
            success: false,
            error: 'Email not confirmed. Please check your inbox and click the confirmation link before logging in.',
          };
        }

        if (errCode === 'invalid_credentials' || rawMessage.toLowerCase().includes('invalid login credentials')) {
          return {
            success: false,
            error: 'Invalid login credentials. If you created your account with Google, please use "Continue with Google".',
          };
        }

        return { success: false, error: rawMessage };
      }

      // Build profile directly from authenticated user object
      const profile = await this.buildUserProfile(data.user, authClient);
      const userProfile: UserProfile = profile || {
        id: data.user.id,
        email: data.user.email ?? email,
        fullName: data.user.user_metadata?.full_name || email.split('@')[0] || 'User',
        role: (data.user.user_metadata?.role as any) || 'customer',
      };

      console.log('[SupabaseUserRepository.login] Login successful, returning userProfile:', userProfile.email);
      return { success: true, user: userProfile };
    } catch (error: any) {
      console.error('[SupabaseUserRepository.login] Exception during login:', error);
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
      console.error('[SupabaseUserRepository.register] Supabase not configured.');
      return { success: false, error: 'Supabase not configured.' };
    }

    const authClient = this.getAuthClient();
    if (!authClient) {
      console.error('[SupabaseUserRepository.register] Auth client not available.');
      return { success: false, error: 'Auth client not available.' };
    }

    try {
      const maskedPassword = password ? `${'*'.repeat(Math.max(0, password.length - 2))}${password.slice(-2)}` : '[empty]';
      console.log(`[SupabaseUserRepository.register] Attempting register for email: "${email}", fullName: "${fullName}", role: "${role}", password masked: "${maskedPassword}"`);

      const { data, error } = await authClient.auth.signUp({
        email,
        password: password || '',
        options: {
          data: { full_name: fullName, role },
        },
      });

      console.log('[SupabaseUserRepository.register] Supabase response:', {
        hasData: !!data,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        identitiesCount: data?.user?.identities?.length,
        hasSession: !!data?.session,
        errorCode: (error as any)?.code,
        errorMessage: error?.message,
        status: (error as any)?.status,
      });

      if (error) {
        const errCode = (error as any)?.code || '';
        const rawMessage = error.message || '';

        if (errCode === 'over_email_send_rate_limit' || rawMessage.toLowerCase().includes('rate limit')) {
          return {
            success: false,
            error: 'Email rate limit exceeded. Please wait a few minutes before trying again.',
          };
        }

        if (errCode === 'email_address_invalid' || rawMessage.toLowerCase().includes('invalid')) {
          return {
            success: false,
            error: 'Please enter a valid email address.',
          };
        }

        const isDuplicate = rawMessage.toLowerCase().includes('user already registered') || rawMessage.toLowerCase().includes('already registered');
        return {
          success: false,
          error: isDuplicate ? 'An account with this email already exists.' : rawMessage,
        };
      }

      if (!data.user) {
        return { success: false, error: 'No user returned from sign up.' };
      }

      // CRITICAL SUPABASE IDENTITIES CHECK:
      // When an account with this email already exists (e.g., registered via Google OAuth or prior sign up),
      // Supabase signUp returns error = null and user object, BUT data.user.identities is an empty array [].
      if (data.user.identities && data.user.identities.length === 0) {
        console.warn(`[SupabaseUserRepository.register] Existing user detected for email "${email}" (identities array is empty).`);
        return {
          success: false,
          error: 'An account with this email already exists. If you previously signed in with Google or Magic Link, please use that sign-in method.',
        };
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
      console.error('[SupabaseUserRepository.register] Exception during register:', error);
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

