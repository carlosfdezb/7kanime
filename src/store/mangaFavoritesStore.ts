/**
 * Manga Favorites Store
 *
 * Refactored in Phase 3 to use sync adapters from SyncContext.
 * - Guest mode: delegates to localStorage adapter
 * - Authenticated mode: delegates to Clerk-backed Supabase adapter
 *
 * Public API is IDENTICAL — components see no change.
 * Components must use SyncContext and pass adapter to store actions.
 */

import { create } from 'zustand';
import type { MangaFavorite } from '../types/manga';
import { SyncAdapter } from '../adapters/types';

interface MangaFavoritesStore {
  favorites: MangaFavorite[];
  addFavorite: (manga: MangaFavorite, adapter?: SyncAdapter<MangaFavorite>) => void;
  removeFavorite: (id: number, adapter?: SyncAdapter<MangaFavorite>) => void;
  isFavorite: (id: number) => boolean;
  toggleFavorite: (manga: MangaFavorite, adapter?: SyncAdapter<MangaFavorite>) => void;
  hydrate: (items: MangaFavorite[]) => void;
}

export const useMangaFavoritesStore = create<MangaFavoritesStore>((set, get) => ({
  favorites: [] as MangaFavorite[],

  addFavorite: (manga: MangaFavorite, adapter?: SyncAdapter<MangaFavorite>) => {
    const { favorites } = get();
    if (!favorites.some(f => f.id === manga.id)) {
      const newFavorites = [...favorites, manga];
      set({ favorites: newFavorites });

      if (adapter) {
        adapter.upsert(manga);
      }
    }
  },

  removeFavorite: (id: number, adapter?: SyncAdapter<MangaFavorite>) => {
    const { favorites } = get();
    const newFavorites = favorites.filter(f => f.id !== id);
    set({ favorites: newFavorites });

    if (adapter) {
      adapter.remove(id);
    }
  },

  isFavorite: (id: number) => {
    return get().favorites.some(f => f.id === id);
  },

  toggleFavorite: (manga: MangaFavorite, adapter?: SyncAdapter<MangaFavorite>) => {
    const { favorites, addFavorite, removeFavorite } = get();
    if (favorites.some(f => f.id === manga.id)) {
      removeFavorite(manga.id, adapter);
    } else {
      addFavorite(manga, adapter);
    }
  },

  hydrate: (items: MangaFavorite[]) => {
    set({ favorites: items });
  },
}));