/**
 * Chapter Read History Store
 *
 * Refactored in Phase 3 to accept sync adapter as parameter.
 * - Guest mode: delegates to localStorage adapter
 * - Authenticated mode: delegates to Clerk-backed Supabase adapter
 *
 * Public API is IDENTICAL — components see no change.
 * Components must use SyncContext and pass adapter to store actions.
 *
 * Phase 4: Added zustand/persist as fallback for guests when no adapter provided.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SyncAdapter } from '../adapters/types';
import type { ReadMangaData } from '../adapters/supabaseChapterAdapter';

interface ReadChaptersStore {
  readChapters: Record<string, ReadMangaData>;
  markAsRead: (mangaId: string, capituloId: string, chapterNum?: string, mangaTitle?: string, coverUrl?: string, adapter?: SyncAdapter<Record<string, ReadMangaData>>) => void;
  removeFromRead: (mangaId: string, capituloId: string, adapter?: SyncAdapter<Record<string, ReadMangaData>>) => void;
  isChapterRead: (mangaId: string, capituloIds: string[]) => boolean;
  getReadHashes: (mangaId: string) => string[];
  clearMangaRead: (mangaId: string, adapter?: SyncAdapter<Record<string, ReadMangaData>>) => void;
  hydrate: (data: Record<string, ReadMangaData>) => void;
}

export const useReadChaptersStore = create<ReadChaptersStore>()(
  persist(
    (set, get) => ({
      readChapters: {} as Record<string, ReadMangaData>,

      markAsRead: (mangaId: string, capituloId: string, chapterNum?: string, mangaTitle?: string, coverUrl?: string, adapter?: SyncAdapter<Record<string, ReadMangaData>>) => {
        set(state => {
          const existing = state.readChapters[mangaId] || { hashes: [], manga_title: '', cover_url: '', chapter_nums: {} };
          if (!existing.hashes.includes(capituloId)) {
            const newChapterNums = { ...existing.chapter_nums, [capituloId]: chapterNum ?? existing.chapter_nums?.[capituloId] ?? '' };
            const newState = {
              readChapters: {
                ...state.readChapters,
                [mangaId]: {
                  hashes: [...existing.hashes, capituloId],
                  manga_title: mangaTitle ?? existing.manga_title,
                  cover_url: coverUrl ?? existing.cover_url,
                  chapter_nums: newChapterNums,
                },
              },
            };

            if (adapter) {
              adapter.upsert(newState.readChapters);
            }

            return newState;
          }
          return state;
        });
      },

      removeFromRead: (mangaId: string, capituloId: string, adapter?: SyncAdapter<Record<string, ReadMangaData>>) => {
        set(state => {
          const existing = state.readChapters[mangaId];
          if (!existing) return state;
          const { [capituloId]: _, ...remainingChapterNums } = existing.chapter_nums ?? {};
          const newState = {
            readChapters: {
              ...state.readChapters,
              [mangaId]: {
                ...existing,
                hashes: existing.hashes.filter(h => h !== capituloId),
                chapter_nums: remainingChapterNums,
              },
            },
          };

          if (adapter) {
            adapter.upsert(newState.readChapters);
          }

          return newState;
        });
      },

      isChapterRead: (mangaId: string, capituloIds: string[]) => {
        const stored = get().readChapters[mangaId];
        const hashes = stored?.hashes ?? [];
        const _capituloIds = Array.isArray(capituloIds) ? capituloIds : [];
        return _capituloIds.some(h => hashes.includes(h));
      },

      getReadHashes: (mangaId: string) => {
        return get().readChapters[mangaId]?.hashes ?? [];
      },

      clearMangaRead: (mangaId: string, adapter?: SyncAdapter<Record<string, ReadMangaData>>) => {
        set(state => {
          const { [mangaId]: _, ...rest } = state.readChapters;

          if (adapter) {
            adapter.remove(mangaId);
          }

          return { readChapters: rest };
        });
      },

      hydrate: (data: Record<string, ReadMangaData>) => {
        set({ readChapters: data });
      },
    }),
    {
      name: 'animeav1-guest-read-chapters',
      partialize: (state) => ({ readChapters: state.readChapters }),
    }
  )
);