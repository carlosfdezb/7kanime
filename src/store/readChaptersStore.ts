import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReadChaptersStore {
  readChapters: Record<number, string[]>;  // mangaId → [hash, hash, ...]
  markAsRead: (mangaId: number, chapterHash: string) => void;
  removeFromRead: (mangaId: number, chapterHash: string) => void;
  isChapterRead: (mangaId: number, versionHashes: string[]) => boolean;
  getReadHashes: (mangaId: number) => string[];
  clearMangaRead: (mangaId: number) => void;
}

export const useReadChaptersStore = create<ReadChaptersStore>()(
  persist(
    (set, get) => ({
      readChapters: {},

      markAsRead: (mangaId: number, chapterHash: string) => {
        set(state => {
          const hashes = state.readChapters[mangaId] || [];
          if (!hashes.includes(chapterHash)) {
            return {
              readChapters: {
                ...state.readChapters,
                [mangaId]: [...hashes, chapterHash],
              },
            };
          }
          return state;
        });
      },

      removeFromRead: (mangaId: number, chapterHash: string) => {
        set(state => {
          const hashes = state.readChapters[mangaId] || [];
          if (hashes.includes(chapterHash)) {
            return {
              readChapters: {
                ...state.readChapters,
                [mangaId]: hashes.filter(h => h !== chapterHash),
              },
            };
          }
          return state;
        });
      },

      isChapterRead: (mangaId: number, versionHashes: string[]) => {
        const storedHashes = get().readChapters[mangaId];
        const hashes = Array.isArray(storedHashes) ? storedHashes : [];
        const _versionHashes = Array.isArray(versionHashes) ? versionHashes : [];
        return _versionHashes.some(h => hashes.includes(h));
      },

      getReadHashes: (mangaId: number) => {
        return get().readChapters[mangaId] ?? [];
      },

      clearMangaRead: (mangaId: number) => {
        set(state => {
          const { [mangaId]: _, ...rest } = state.readChapters;
          return { readChapters: rest };
        });
      },
    }),
    {
      name: 'animeav1-read-chapters',
    }
  )
);
