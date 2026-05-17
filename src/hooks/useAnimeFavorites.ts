import { useCallback } from 'react';
import { useFavoritesStore } from '../store/favoritesStore';
import { useSyncContext } from '../context/SyncContext';
import type { CatalogItem } from '../types/api';

export function useAnimeFavorites() {
  const { favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite } = useFavoritesStore();
  const { animeFavoritesAdapter, isAuthenticated } = useSyncContext();

  const addAnimeFavorite = useCallback((anime: CatalogItem) => {
    addFavorite(anime, animeFavoritesAdapter ?? undefined);
  }, [addFavorite, animeFavoritesAdapter]);

  const removeAnimeFavorite = useCallback((id: number) => {
    removeFavorite(id, animeFavoritesAdapter ?? undefined);
  }, [removeFavorite, animeFavoritesAdapter]);

  const toggleAnimeFavorite = useCallback((anime: CatalogItem) => {
    toggleFavorite(anime, animeFavoritesAdapter ?? undefined);
  }, [toggleFavorite, animeFavoritesAdapter]);

  return {
    favorites,
    isFavorite,
    addFavorite: addAnimeFavorite,
    removeFavorite: removeAnimeFavorite,
    toggleFavorite: toggleAnimeFavorite,
    isAuthenticated,
  };
}
