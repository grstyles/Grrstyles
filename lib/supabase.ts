import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/config';

export const supabase = createBrowserClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    cookies: {
      // For browser client, you need to provide these methods
      getAll: () => {
        return document.cookie.split('; ').map(cookie => {
          const [name, value] = cookie.split('=');
          return { name, value };
        });
      },
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => {
          document.cookie = `${name}=${value}; path=${options?.path || '/'}`;
        });
      },
    }
  }
);

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};