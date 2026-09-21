import { useCallback } from 'react';
import { useFavoritesStore } from '../store/favoritesStore';
import { useSyncAdapters } from '../context/SyncContext';
import type { CatalogItem } from '../types/api';

export function useAnimeFavorites() {
  const { favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite } = useFavoritesStore();
  const { favorites: adapter } = useSyncAdapters();

  const addAnimeFavorite = useCallback(
    (anime: CatalogItem) => addFavorite(anime, adapter),
    [addFavorite, adapter]
  );

  const removeAnimeFavorite = useCallback(
    (id: number) => removeFavorite(id, adapter),
    [removeFavorite, adapter]
  );

  const toggleAnimeFavorite = useCallback(
    (anime: CatalogItem) => toggleFavorite(anime, adapter),
    [toggleFavorite, adapter]
  );

  return {
    favorites,
    isFavorite,
    addFavorite: addAnimeFavorite,
    removeFavorite: removeAnimeFavorite,
    toggleFavorite: toggleAnimeFavorite,
  };
}
