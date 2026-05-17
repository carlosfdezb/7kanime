/**
 * Supabase Chapter History Adapter
 *
 * Implements sync for chapter_history table.
 * Used when user IS authenticated — syncs chapter read history to Supabase.
 *
 * Refactored to accept userId and getToken explicitly (no auth store dependency).
 */

import { createClerkSupabaseClient } from '../lib/clerkSupabase';
import { addToQueue as addToBatchQueue } from '../lib/batchQueue';
import { withOfflineQueue } from '../lib/offlineQueue';
import type { SyncAdapter } from './types';

/**
 * Read chapters state — single record, not array.
 * Maps mangaId (string) → read manga data with chapter hashes and metadata.
 */
export interface ReadMangaData {
  hashes: string[];
  manga_title: string;
  cover_url: string;
  chapter_nums?: Record<string, string>;
}

export type ReadChaptersState = Record<string, ReadMangaData>;

/**
 * Creates a chapter history adapter for the given user.
 */
export function createSupabaseChapterAdapter(
  userId: string,
  getToken: () => Promise<string | null>
): SyncAdapter<ReadChaptersState> {
  return {
    getAll(): ReadChaptersState[] {
      // Synchronous read from local state only — use hydrate() for remote
      return [];
    },

    upsert(item: ReadChaptersState): void {
      // item is { mangaId: [capituloId1, capituloId2], mangaId2: [capituloId3] }
      // Batch all mangaId+capituloId combinations into the debounce queue
      // to avoid excessive Supabase writes on rapid marking
      const entries = Object.entries(item);
      const rows: { user_id: string; manga_id: string; manga_title: string; cover_url: string; chapter_hash: string; chapter_num: string; read_at: string }[] = [];

      for (const [mangaId, data] of entries) {
        for (const chapterHash of data.hashes) {
          rows.push({
            user_id: userId,
            manga_id: mangaId,
            manga_title: data.manga_title || '',
            cover_url: data.cover_url || '',
            chapter_hash: chapterHash,
            chapter_num: data.chapter_nums?.[chapterHash] || '',
            read_at: new Date().toISOString(),
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
                .from('chapter_history')
                .upsert(row, { onConflict: 'user_id,manga_id,chapter_hash' });
            }
            return null;
          },
          'chapter_history',
          rows as unknown as Record<string, unknown>
        );
      });
    },

    remove(id: string | number): void {
      // For chapter history, id is the mangaId (string)
      const supabase = createClerkSupabaseClient(getToken);

      const mangaId = String(id);

      supabase
        .from('chapter_history')
        .delete()
        .eq('manga_id', mangaId)
        .then(({ error }) => {
          if (error) {
            console.warn('[SupabaseChapterAdapter] remove failed:', error.message);
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
 * Factory that creates a Supabase chapter adapter with live Clerk auth.
 */
export function supabaseChapterAdapterFactory() {
  return function makeAdapter(
    userId: string,
    getToken: () => Promise<string | null>
  ): SyncAdapter<ReadChaptersState> {
    return createSupabaseChapterAdapter(userId, getToken);
  };
}
