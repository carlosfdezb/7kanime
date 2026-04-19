import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MangaFavorite {
  id: number;
  title: string;
  coverUrl: string;
  type: string;
}

interface MangaFavoritesStore {
  favorites: MangaFavorite[];
  addFavorite: (manga: MangaFavorite) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
  toggleFavorite: (manga: MangaFavorite) => void;
}

export const useMangaFavoritesStore = create<MangaFavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (manga: MangaFavorite) => {
        const { favorites } = get();
        if (!favorites.some(f => f.id === manga.id)) {
          set({ favorites: [...favorites, manga] });
        }
      },

      removeFavorite: (id: number) => {
        const { favorites } = get();
        set({ favorites: favorites.filter(f => f.id !== id) });
      },

      isFavorite: (id: number) => {
        return get().favorites.some(f => f.id === id);
      },

      toggleFavorite: (manga: MangaFavorite) => {
        const { favorites, addFavorite, removeFavorite } = get();
        if (favorites.some(f => f.id === manga.id)) {
          removeFavorite(manga.id);
        } else {
          addFavorite(manga);
        }
      },
    }),
    {
      name: 'animeav1-manga-favorites',
    }
  )
);
