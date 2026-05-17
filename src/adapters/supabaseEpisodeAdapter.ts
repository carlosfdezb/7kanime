/**
 * Supabase Episode History Adapter
 *
 * Implements sync for episode_history table.
 * Used when user IS authenticated — syncs episode watch history to Supabase.
 *
 * Refactored to accept userId and getToken explicitly (no auth store dependency).
 *
 * Risk 1 mitigation: anime_slug is stored denormalized in the table since
 * slug→ID resolution via catalog API may fail. The table uses anime_slug (text)
 * as the primary key, not anime_id (integer).
 */

import { createClerkSupabaseClient } from '../lib/clerkSupabase';
import { addToQueue as addToBatchQueue } from '../lib/batchQueue';
import { withOfflineQueue } from '../lib/offlineQueue';
import type { SyncAdapter } from './types';

/**
 * Watched episodes state — single record, not array.
 * Maps anime_slug → watched anime data with episodes array and metadata.
 */
export interface WatchedAnime {
  episodes: number[];
  anime_title: string;
  poster_url: string;
}

export type WatchedState = Record<string, WatchedAnime>;

/**
 * Creates an episode history adapter for the given user.
 */
export function createSupabaseEpisodeAdapter(
  userId: string,
  getToken: () => Promise<string | null>
): SyncAdapter<WatchedState> {
  return {
    getAll(): WatchedState[] {
      // Synchronous read from local state only — use hydrate() for remote
      return [];
    },

    upsert(item: WatchedState): void {
      // item is { "slug": [1, 2, 3], "slug2": [5] }
      // Batch all slug+episode combinations into the debounce queue
      // to avoid excessive Supabase writes on rapid marking
      const entries = Object.entries(item);
      const rows: { user_id: string; anime_slug: string; anime_title: string; poster_url: string; episode_number: number; watched_at: string }[] = [];

      for (const [animeSlug, data] of entries) {
        for (const episodeNumber of Array.isArray(data.episodes) ? data.episodes : []) {
          rows.push({
            user_id: userId,
            anime_slug: animeSlug,
            anime_title: data.anime_title || animeSlug,
            poster_url: data.poster_url || '',
            episode_number: episodeNumber,
            watched_at: new Date().toISOString(),
          });
        }
      }

      if (rows.length === 0) return;

      // Wrap entire batch in offline queue — if flush fails due to network error,
      // all rows get queued together for replay on reconnect
      addToBatchQueue(async () => {
        await withOfflineQueue(
          async () => {
            const sb = createClerkSupabaseClient(getToken);
            for (const row of rows) {
              await sb
                .from('episode_history')
                .upsert(row, { onConflict: 'user_id,anime_slug,episode_number' });
            }
            return null;
          },
          'episode_history',
          rows as unknown as Record<string, unknown>
        );
      });
    },

    remove(id: string | number): void {
      // For episode history, id is the anime_slug (string)
      const supabase = createClerkSupabaseClient(getToken);

      const slug = String(id);

      supabase
        .from('episode_history')
        .delete()
        .eq('anime_slug', slug)
        .then(({ error }) => {
          if (error) {
            console.warn('[SupabaseEpisodeAdapter] remove failed:', error.message);
          }
        });
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
 * Factory that creates a Supabase episode adapter with live Clerk auth.
 */
export function supabaseEpisodeAdapterFactory() {
  return function makeAdapter(
    userId: string,
    getToken: () => Promise<string | null>
  ): SyncAdapter<WatchedState> {
    return createSupabaseEpisodeAdapter(userId, getToken);
  };
}