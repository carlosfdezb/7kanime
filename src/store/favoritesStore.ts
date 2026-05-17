/**
 * Anime Favorites Store
 *
 * Refactored in Phase 3 to use sync adapters from SyncContext.
 * - Guest mode: delegates to localStorage adapter
 * - Authenticated mode: delegates to Clerk-backed Supabase adapter
 *
 * Public API is IDENTICAL — components see no change.
 * Components must use SyncContext and pass adapter to store actions.
 */

import { create } from 'zustand';
import type { CatalogItem } from '../types/api';
import { SyncAdapter } from '../adapters/types';

interface FavoritesStore {
  favorites: CatalogItem[];
  addFavorite: (anime: CatalogItem, adapter?: SyncAdapter<CatalogItem>) => void;
  removeFavorite: (id: number, adapter?: SyncAdapter<CatalogItem>) => void;
  isFavorite: (id: number) => boolean;
  toggleFavorite: (anime: CatalogItem, adapter?: SyncAdapter<CatalogItem>) => void;
  hydrate: (items: CatalogItem[]) => void;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [] as CatalogItem[],

  addFavorite: (anime: CatalogItem, adapter?: SyncAdapter<CatalogItem>) => {
    const { favorites } = get();
    if (!favorites.some(f => f.id === anime.id)) {
      const newFavorites = [...favorites, anime];
      set({ favorites: newFavorites });

      if (adapter) {
        adapter.upsert(anime);
      }
    }
  },

  removeFavorite: (id: number, adapter?: SyncAdapter<CatalogItem>) => {
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

  toggleFavorite: (anime: CatalogItem, adapter?: SyncAdapter<CatalogItem>) => {
    const { favorites, addFavorite, removeFavorite } = get();
    if (favorites.some(f => f.id === anime.id)) {
      removeFavorite(anime.id, adapter);
    } else {
      addFavorite(anime, adapter);
    }
  },

  hydrate: (items: CatalogItem[]) => {
    set({ favorites: items });
  },
}));