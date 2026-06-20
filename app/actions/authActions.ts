'use server';

import { config } from '@/lib/config';

/**
 * Securely verifies admin credentials on the server side
 * to prevent exposing passwords to the client browser.
 */
export async function verifyAdminCredentials(email: string, password?: string): Promise<boolean> {
  if (!email || !password) return false;
  
  const adminEmail = config.adminEmail;
  const adminPassword = config.adminPassword;
  
  if (!adminEmail || !adminPassword) {
    console.error('Admin credentials are not configured in environment variables.');
    return false;
  }
  
  return email === adminEmail && password === adminPassword;
}
