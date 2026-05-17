import { useCallback } from 'react';
import { useMangaFavoritesStore } from '../store/mangaFavoritesStore';
import { useSyncContext } from '../context/SyncContext';
import type { MangaFavorite } from '../types/manga';

export function useMangaFavorites() {
  const { favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite } = useMangaFavoritesStore();
  const { mangaFavoritesAdapter, isAuthenticated } = useSyncContext();

  const addManga = useCallback((manga: MangaFavorite) => {
    addFavorite(manga, mangaFavoritesAdapter ?? undefined);
  }, [addFavorite, mangaFavoritesAdapter]);

  const removeManga = useCallback((publicId: string) => {
    removeFavorite(publicId, mangaFavoritesAdapter ?? undefined);
  }, [removeFavorite, mangaFavoritesAdapter]);

  const toggleMangaFavorite = useCallback((manga: MangaFavorite) => {
    toggleFavorite(manga, mangaFavoritesAdapter ?? undefined);
  }, [toggleFavorite, mangaFavoritesAdapter]);

  return {
    favorites,
    isMangaFavorite: isFavorite,
    addManga,
    removeManga,
    toggleMangaFavorite,
    isAuthenticated,
  };
}
