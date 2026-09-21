/**
 * Sync Provider — wires the per-device HTTP adapters to the stores.
 *
 * No auth. Adapters hold an in-memory cache that is hydrated once on mount
 * (and can be re-hydrated manually). Components consume adapters via the
 * `useSyncAdapters()` hook.
 */

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { createHttpFavoritesAdapter } from '../adapters/httpFavoritesAdapter';
import { createHttpWatchedAdapter } from '../adapters/httpWatchedAdapter';
import { createHttpPreferencesAdapter } from '../adapters/httpPreferencesAdapter';
import type { CatalogItem } from '../types/api';
import type { WatchedAnime } from '../store/watchedStore';
import type { SyncAdapter } from '../adapters/types';
import type { UserPreferences } from '../types/preferences';
import { useFavoritesStore } from '../store/favoritesStore';
import { useWatchedStore } from '../store/watchedStore';
import { usePreferencesStore } from '../store/preferencesStore';

export interface Adapters {
  favorites: SyncAdapter<CatalogItem>;
  watched: SyncAdapter<Record<string, WatchedAnime>>;
  preferences: SyncAdapter<UserPreferences>;
}

const SyncContext = createContext<Adapters | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const adapters = useMemo<Adapters>(
    () => ({
      favorites: createHttpFavoritesAdapter(),
      watched: createHttpWatchedAdapter(),
      preferences: createHttpPreferencesAdapter(),
    }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([
          adapters.favorites.hydrate(),
          adapters.watched.hydrate(),
          adapters.preferences.hydrate(),
        ]);
      } catch (err) {
        console.warn('[SyncProvider] hydration failed:', err);
      }
      if (cancelled) return;
      useFavoritesStore.getState().hydrate(adapters.favorites.getAll());
      const watched = adapters.watched.getAll();
      if (watched[0]) useWatchedStore.getState().hydrate(watched[0]);
      const prefs = adapters.preferences.getAll()[0];
      if (prefs) usePreferencesStore.getState().hydrate(prefs);
    })();
    return () => {
      cancelled = true;
    };
  }, [adapters]);

  return <SyncContext.Provider value={adapters}>{children}</SyncContext.Provider>;
}

export function useSyncAdapters(): Adapters {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSyncAdapters must be used inside <SyncProvider>');
  }
  return ctx;
}
