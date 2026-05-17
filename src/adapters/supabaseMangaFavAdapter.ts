/**
 * Supabase Manga Favorites Adapter
 *
 * Implements SyncAdapter<MangaFavorite> for the manga_favorites table.
 * Used when user IS authenticated — syncs manga favorites to Supabase.
 *
 * Refactored to accept userId and getToken explicitly (no auth store dependency).
 *
 * Supabase stores minimal columns: user_id, manga_id, title, cover_url, type, added_at
 */

import { createClerkSupabaseClient } from '../lib/clerkSupabase';
import { withOfflineQueue } from '../lib/offlineQueue';
import type { SyncAdapter } from './types';
import type { MangaFavorite } from '../types/manga';

export function createSupabaseMangaFavoritesAdapter(
  userId: string,
  getToken: () => Promise<string | null>
): SyncAdapter<MangaFavorite> {
  return {
    getAll(): MangaFavorite[] {
      // Synchronous read from local state only — use hydrate() for remote
      return [];
    },

    upsert(item: MangaFavorite): void {
      const supabase = createClerkSupabaseClient(getToken);

      const data = {
        user_id: userId,
        manga_id: item.id,
        title: item.title,
        cover_url: item.coverUrl,
        type: item.type,
        added_at: new Date().toISOString(),
      };

      // Wrap with offline queue — network errors get queued for later flush
      withOfflineQueue(
        async () => {
          const { error } = await supabase
            .from('manga_favorites')
            .upsert(data, { onConflict: 'user_id,manga_id' });
          if (error) {
            console.warn('[SupabaseMangaFavAdapter] upsert failed:', error.message);
          }
        },
        'manga_favorites',
        data as Record<string, unknown>
      );
    },

    remove(id: string | number): void {
      const supabase = createClerkSupabaseClient(getToken);

      const data = { id_column: 'manga_id', id_value: id };

      // Wrap with offline queue — network errors get queued for later flush
      withOfflineQueue(
        async () => {
          const { error } = await supabase
            .from('manga_favorites')
            .delete()
            .eq('manga_id', id);
          if (error) {
            console.warn('[SupabaseMangaFavAdapter] remove failed:', error.message);
          }
        },
        'manga_favorites',
        data as Record<string, unknown>
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
 * Factory that creates a Supabase manga favorites adapter with live Clerk auth.
 */
export function supabaseMangaFavoritesAdapterFactory() {
  return function makeAdapter(
    userId: string,
    getToken: () => Promise<string | null>
  ): SyncAdapter<MangaFavorite> {
    return createSupabaseMangaFavoritesAdapter(userId, getToken);
  };
}