import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _initAttempted = false;

function getSupabaseClient(): SupabaseClient | null {
  if (_supabase) return _supabase;
  if (_initAttempted) return null;

  _initAttempted = true;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
    return _supabase;
  } catch {
    return null;
  }
}

/**
 * Returns the Supabase client, or null if env vars are missing or initialization fails.
 * When null, the app operates in guest mode with localStorage only.
 * All consumers MUST check: `if (!supabase) return early` before using the client.
 */
export function getSupabase(): SupabaseClient | null {
  return getSupabaseClient();
}

/**
 * Direct export for components that need the client for one-off operations.
 * Returns null if env vars are missing — callers MUST check before using.
 */
export const supabase = getSupabase();