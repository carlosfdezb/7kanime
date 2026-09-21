/**
 * Anime Favorites Store
 *
 * Public API is preserved — components call addFavorite / removeFavorite /
 * toggleFavorite / isFavorite / hydrate unchanged. The adapter parameter is
 * still accepted but optional: when omitted, the store performs only the
 * in-memory + persist write. The SyncProvider wires the HTTP adapter at the
 * app root and components keep working without changes.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CatalogItem } from '../types/api';
import type { SyncAdapter } from '../adapters/types';

interface FavoritesStore {
  favorites: CatalogItem[];
  addFavorite: (anime: CatalogItem, adapter?: SyncAdapter<CatalogItem>) => void;
  removeFavorite: (id: number, adapter?: SyncAdapter<CatalogItem>) => void;
  isFavorite: (id: number) => boolean;
  toggleFavorite: (anime: CatalogItem, adapter?: SyncAdapter<CatalogItem>) => void;
  hydrate: (items: CatalogItem[]) => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [] as CatalogItem[],

      addFavorite: (anime, adapter) => {
        const { favorites } = get();
        if (favorites.some((f) => f.id === anime.id)) return;
        set({ favorites: [...favorites, anime] });
        adapter?.upsert(anime);
      },

      removeFavorite: (id, adapter) => {
        const { favorites } = get();
        if (!favorites.some((f) => f.id === id)) return;
        set({ favorites: favorites.filter((f) => f.id !== id) });
        adapter?.remove(id);
      },

      isFavorite: (id) => get().favorites.some((f) => f.id === id),

      toggleFavorite: (anime, adapter) => {
        const { favorites, addFavorite, removeFavorite } = get();
        if (favorites.some((f) => f.id === anime.id)) {
          removeFavorite(anime.id, adapter);
        } else {
          addFavorite(anime, adapter);
        }
      },

      hydrate: (items) => set({ favorites: items }),
    }),
    {
      name: 'animeav1-favorites',
      partialize: (state) => ({ favorites: state.favorites }),
    }
  )
);