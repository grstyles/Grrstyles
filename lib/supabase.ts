import { createClient } from '@supabase/supabase-js';
import { config } from './config';

export const isSupabaseConfigured = (): boolean => config.isSupabaseConfigured;

export const supabase = config.isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseKey)
  : null;
