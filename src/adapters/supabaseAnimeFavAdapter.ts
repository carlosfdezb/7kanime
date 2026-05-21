/**
 * Supabase Anime Favorites Adapter
 *
 * Implements SyncAdapter<CatalogItem> for the anime_favorites table.
 * Used when user IS authenticated — syncs favorites to Supabase.
 *
 * Refactored to accept userId and getToken explicitly (no auth store dependency).
 *
 * Supabase stores minimal columns: user_id, anime_id, title, poster, type, type_slug, added_at
 * Components may need full CatalogItem objects — the adapter stores minimal data
 * and components consume from the store which has the full objects.
 */

import { createClerkSupabaseClient } from '../lib/clerkSupabase';
import { withOfflineQueue } from '../lib/offlineQueue';
import type { SyncAdapter } from './types';
import type { CatalogItem } from '../types/api';

export function createSupabaseAnimeFavoritesAdapter(
  userId: string,
  getToken: () => Promise<string | null>
): SyncAdapter<CatalogItem> {
  return {
    getAll(): CatalogItem[] {
      // Synchronous read from local state only — use hydrate() for remote
      return [];
    },

    upsert(item: CatalogItem): void {
      const supabase = createClerkSupabaseClient(getToken);

      const data = {
        user_id: userId,
        anime_id: item.id,
        anime_slug: item.slug,
        title: item.title,
        poster_url: item.poster,
        type: item.type,
        added_at: new Date().toISOString(),
      };

      // Wrap with offline queue — network errors get queued for later flush
      withOfflineQueue(
        async () => {
          const { error } = await supabase
            .from('anime_favorites')
            .upsert(data, { onConflict: 'user_id,anime_id' });
          if (error) {
            console.warn('[SupabaseAnimeFavAdapter] upsert failed:', error.message);
          }
        },
        'anime_favorites',
        data as Record<string, unknown>,
        getToken.toString()
      );
    },

    remove(id: string | number): void {
      const supabase = createClerkSupabaseClient(getToken);

      const data = { id_column: 'anime_id', id_value: id };

      // Wrap with offline queue — network errors get queued for later flush
      withOfflineQueue(
        async () => {
          const { error } = await supabase
            .from('anime_favorites')
            .delete()
            .eq('anime_id', id);
          if (error) {
            console.warn('[SupabaseAnimeFavAdapter] remove failed:', error.message);
          }
        },
        'anime_favorites',
        data as Record<string, unknown>,
        getToken.toString()
      );
    },

    async hydrate(): Promise<void> {
      // Real hydration handled by the store itself
      return Promise.resolve();
    },

    isEnabled(): boolean {
      return true; // Enabled when userId is provided (auth check done by caller)
    },
  };
}

/**
 * Factory that creates a Supabase anime favorites adapter with live Clerk auth.
 * Returns a function that creates adapters — called by SyncContext with current userId/getToken.
 */
export function supabaseAnimeFavoritesAdapterFactory() {
  return function makeAdapter(
    userId: string,
    getToken: () => Promise<string | null>
  ): SyncAdapter<CatalogItem> {
    return createSupabaseAnimeFavoritesAdapter(userId, getToken);
  };
}