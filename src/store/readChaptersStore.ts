/**
 * Chapter Read History Store
 *
 * Refactored in Phase 3 to accept sync adapter as parameter.
 * - Guest mode: delegates to localStorage adapter
 * - Authenticated mode: delegates to Clerk-backed Supabase adapter
 *
 * Public API is IDENTICAL — components see no change.
 * Components must use SyncContext and pass adapter to store actions.
 */

import { create } from 'zustand';
import type { SyncAdapter } from '../adapters/types';
import type { ReadMangaData } from '../adapters/supabaseChapterAdapter';

interface ReadChaptersStore {
  readChapters: Record<number, ReadMangaData>;
  markAsRead: (mangaId: number, chapterHash: string, chapterNum?: string, mangaTitle?: string, coverUrl?: string, adapter?: SyncAdapter<Record<number, ReadMangaData>>) => void;
  removeFromRead: (mangaId: number, chapterHash: string, adapter?: SyncAdapter<Record<number, ReadMangaData>>) => void;
  isChapterRead: (mangaId: number, versionHashes: string[]) => boolean;
  getReadHashes: (mangaId: number) => string[];
  clearMangaRead: (mangaId: number, adapter?: SyncAdapter<Record<number, ReadMangaData>>) => void;
  hydrate: (data: Record<number, ReadMangaData>) => void;
}

export const useReadChaptersStore = create<ReadChaptersStore>((set, get) => ({
  readChapters: {} as Record<number, ReadMangaData>,

  markAsRead: (mangaId: number, chapterHash: string, chapterNum?: string, mangaTitle?: string, coverUrl?: string, adapter?: SyncAdapter<Record<number, ReadMangaData>>) => {
    set(state => {
      const existing = state.readChapters[mangaId] || { hashes: [], manga_title: '', cover_url: '', chapter_nums: {} };
      if (!existing.hashes.includes(chapterHash)) {
        const newChapterNums = { ...existing.chapter_nums, [chapterHash]: chapterNum ?? existing.chapter_nums?.[chapterHash] ?? '' };
        const newState = {
          readChapters: {
            ...state.readChapters,
            [mangaId]: {
              hashes: [...existing.hashes, chapterHash],
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

  removeFromRead: (mangaId: number, chapterHash: string, adapter?: SyncAdapter<Record<number, ReadMangaData>>) => {
    set(state => {
      const existing = state.readChapters[mangaId];
      if (!existing) return state;
      const { [chapterHash]: _, ...remainingChapterNums } = existing.chapter_nums ?? {};
      const newState = {
        readChapters: {
          ...state.readChapters,
          [mangaId]: {
            ...existing,
            hashes: existing.hashes.filter(h => h !== chapterHash),
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

  isChapterRead: (mangaId: number, versionHashes: string[]) => {
    const stored = get().readChapters[mangaId];
    const hashes = stored?.hashes ?? [];
    const _versionHashes = Array.isArray(versionHashes) ? versionHashes : [];
    return _versionHashes.some(h => hashes.includes(h));
  },

  getReadHashes: (mangaId: number) => {
    return get().readChapters[mangaId]?.hashes ?? [];
  },

  clearMangaRead: (mangaId: number, adapter?: SyncAdapter<Record<number, ReadMangaData>>) => {
    set(state => {
      const { [mangaId]: _, ...rest } = state.readChapters;

      if (adapter) {
        adapter.remove(mangaId);
      }

      return { readChapters: rest };
    });
  },

  hydrate: (data: Record<number, ReadMangaData>) => {
    set({ readChapters: data });
  },
}));