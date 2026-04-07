import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CatalogItem } from '../types/api';

interface FavoritesStore {
  favorites: CatalogItem[];
  addFavorite: (anime: CatalogItem) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
  toggleFavorite: (anime: CatalogItem) => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (anime: CatalogItem) => {
        const { favorites } = get();
        if (!favorites.some(f => f.id === anime.id)) {
          set({ favorites: [...favorites, anime] });
        }
      },

      removeFavorite: (id: number) => {
        const { favorites } = get();
        set({ favorites: favorites.filter(f => f.id !== id) });
      },

      isFavorite: (id: number) => {
        return get().favorites.some(f => f.id === id);
      },

      toggleFavorite: (anime: CatalogItem) => {
        const { favorites, addFavorite, removeFavorite } = get();
        if (favorites.some(f => f.id === anime.id)) {
          removeFavorite(anime.id);
        } else {
          addFavorite(anime);
        }
      },
    }),
    {
      name: 'animeav1-favorites',
    }
  )
);
