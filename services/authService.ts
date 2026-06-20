import { repo } from '@/lib/repositories';
import type { UserProfile } from '@/lib/repositories/userRepository';

export type { UserProfile };

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    return repo.users.getUser();
  },

  async register(
    email: string,
    password?: string,
    fullName?: string,
    role: 'customer' | 'admin' = 'customer'
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    return repo.users.register(email, password, fullName, role);
  },

  async login(
    email: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    return repo.users.login(email, password);
  },

  async loginWithGoogle(
    email?: string,
    name?: string,
    avatar?: string
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    return repo.users.loginWithGoogle(email, name, avatar);
  },

  async logout(): Promise<boolean> {
    return repo.users.logout();
  },

  async updateProfile(
    updates: Partial<Pick<UserProfile, 'fullName' | 'email'>>
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    return repo.users.updateProfile(updates);
  },

  async forgotPassword(_email: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  },

  async isAdmin(userId: string): Promise<boolean> {
    return repo.users.isAdmin(userId);
  },
};
