import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client that injects a Clerk JWT as the Authorization header
 * on every request. This enables Supabase RLS policies to identify the user
 * via the Clerk token's `sub` claim.
 *
 * @param getToken - async function that returns the current Clerk session token
 *                   (from useAuth().getToken()) or null if not signed in.
 */
export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>
): SupabaseClient {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken();
        const headers = new Headers(options.headers);

        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        return fetch(url, { ...options, headers });
      },
    },
  });
}