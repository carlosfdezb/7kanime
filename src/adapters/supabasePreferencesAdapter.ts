/**
 * Supabase Preferences Adapter
 *
 * Persists user preferences to Supabase for authenticated users.
 * Falls back to localStorage if Supabase fails (e.g., table doesn't exist).
 * Uses Clerk JWT for RLS.
 */

import { createClerkSupabaseClient } from '../lib/clerkSupabase';
import { addToQueue as addToBatchQueue } from '../lib/batchQueue';
import { withOfflineQueue } from '../lib/offlineQueue';
import type { SyncAdapter } from './types';
import type { UserPreferences } from '../types/preferences';

const LOCAL_STORAGE_KEY = '7kanime-preferences';

function saveToLocalFallback(preferences: UserPreferences): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences));
  } catch (e) {
    console.warn('[SupabasePreferencesAdapter] localStorage fallback failed:', e);
  }
}

/**
 * Creates a Supabase-based adapter for user preferences.
 */
export function createSupabasePreferencesAdapter(
  userId: string,
  getToken: () => Promise<string | null>
): SyncAdapter<UserPreferences> {
  return {
    getAll(): UserPreferences[] {
      // Synchronous read from local state only — use hydrate() for remote
      return [];
    },

    upsert(item: UserPreferences): void {
      addToBatchQueue(async () => {
        await withOfflineQueue(
          async () => {
            const sb = createClerkSupabaseClient(getToken);
            const { error } = await sb
              .from('user_preferences')
              .upsert(
                { user_id: userId, preferences: item },
                { onConflict: 'user_id' }
              );

            if (error) {
              console.warn('[SupabasePreferencesAdapter] upsert failed:', error.message);
              // Fallback to localStorage so user doesn't lose their preference
              saveToLocalFallback(item);
              throw error; // Re-throw so offlineQueue can retry later
            }
          },
          'user_preferences',
          item as unknown as Record<string, unknown>,
          getToken.toString()
        );
      });
    },

    remove(_id: string | number): void {
      const sb = createClerkSupabaseClient(getToken);
      sb
        .from('user_preferences')
        .delete()
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) {
            console.warn('[SupabasePreferencesAdapter] remove failed:', error.message);
          }
        });
    },

    async hydrate(): Promise<void> {
      // Real hydration is handled by the store via syncHydration.ts
      return Promise.resolve();
    },

    isEnabled(): boolean {
      return true;
    },
  };
}

/**
 * Factory for Supabase preferences adapter.
 */
export function supabasePreferencesAdapterFactory() {
  return function makeAdapter(
    userId: string,
    getToken: () => Promise<string | null>
  ): SyncAdapter<UserPreferences> {
    return createSupabasePreferencesAdapter(userId, getToken);
  };
}