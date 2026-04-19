import { useMangaFavoritesStore } from '../store/mangaFavoritesStore';
import type { MangaFavorite } from '../types/manga';

export function useMangaFavorites() {
  const { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite } = useMangaFavoritesStore();

  const addManga = (manga: MangaFavorite) => {
    addFavorite(manga);
  };

  const removeManga = (id: number) => {
    removeFavorite(id);
  };

  const isMangaFavorite = (id: number) => {
    return isFavorite(id);
  };

  const toggleMangaFavorite = (manga: MangaFavorite) => {
    toggleFavorite(manga);
  };

  return {
    favorites,
    addManga,
    removeManga,
    isMangaFavorite,
    toggleMangaFavorite,
  };
}
