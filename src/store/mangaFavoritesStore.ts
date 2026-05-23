/**
 * Manga Favorites Store
 *
 * Refactored in Phase 3 to use sync adapters from SyncContext.
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
import type { MangaFavorite } from '../types/manga';
import { SyncAdapter } from '../adapters/types';

interface MangaFavoritesStore {
  favorites: MangaFavorite[];
  addFavorite: (manga: MangaFavorite, adapter?: SyncAdapter<MangaFavorite>) => void;
  removeFavorite: (publicId: string, adapter?: SyncAdapter<MangaFavorite>) => void;
  isFavorite: (publicId: string) => boolean;
  toggleFavorite: (manga: MangaFavorite, adapter?: SyncAdapter<MangaFavorite>) => void;
  hydrate: (items: MangaFavorite[]) => void;
}

export const useMangaFavoritesStore = create<MangaFavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [] as MangaFavorite[],

      addFavorite: (manga: MangaFavorite, adapter?: SyncAdapter<MangaFavorite>) => {
        const { favorites } = get();
        if (!favorites.some(f => f.publicId === manga.publicId)) {
          const newFavorites = [...favorites, manga];
          set({ favorites: newFavorites });

          if (adapter) {
            adapter.upsert(manga);
          }
        }
      },

      removeFavorite: (publicId: string, adapter?: SyncAdapter<MangaFavorite>) => {
        const { favorites } = get();
        const newFavorites = favorites.filter(f => f.publicId !== publicId);
        set({ favorites: newFavorites });

        if (adapter) {
          adapter.remove(publicId);
        }
      },

      isFavorite: (publicId: string) => {
        return get().favorites.some(f => f.publicId === publicId);
      },

      toggleFavorite: (manga: MangaFavorite, adapter?: SyncAdapter<MangaFavorite>) => {
        const { favorites, addFavorite, removeFavorite } = get();
        if (favorites.some(f => f.publicId === manga.publicId)) {
          removeFavorite(manga.publicId, adapter);
        } else {
          addFavorite(manga, adapter);
        }
      },

      hydrate: (items: MangaFavorite[]) => {
        set({ favorites: items });
      },
    }),
    {
      name: 'animeav1-guest-manga-favorites',
      partialize: (state) => ({ favorites: state.favorites }),
    }
  )
);