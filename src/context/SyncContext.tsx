import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { setFlushAuth } from '../lib/offlineQueue';
import type { SyncAdapter } from '../adapters/types';
import type { CatalogItem } from '../types/api';
import type { MangaFavorite } from '../types/manga';
import type { UserPreferences } from '../types/preferences';
import { supabaseAnimeFavoritesAdapterFactory } from '../adapters/supabaseAnimeFavAdapter';
import { supabaseMangaFavoritesAdapterFactory } from '../adapters/supabaseMangaFavAdapter';
import { supabaseEpisodeAdapterFactory, type WatchedState } from '../adapters/supabaseEpisodeAdapter';
import { supabaseChapterAdapterFactory, type ReadChaptersState } from '../adapters/supabaseChapterAdapter';
import { supabasePreferencesAdapterFactory } from '../adapters/supabasePreferencesAdapter';
import { createLocalStoragePreferencesAdapter } from '../adapters/localStoragePreferencesAdapter';

interface SyncContextValue {
  animeFavoritesAdapter: SyncAdapter<CatalogItem> | null;
  mangaFavoritesAdapter: SyncAdapter<MangaFavorite> | null;
  watchedAdapter: SyncAdapter<WatchedState> | null;
  readChaptersAdapter: SyncAdapter<ReadChaptersState> | null;
  preferencesAdapter: SyncAdapter<UserPreferences>;
  isAuthenticated: boolean;
}

const SyncContext = createContext<SyncContextValue | null>(null);

interface SyncProviderProps {
  children: ReactNode;
}

/**
 * Provides sync adapters based on authentication state.
 * When signed in: uses Clerk-backed Supabase adapters (with JWT injection)
 * When signed out: uses localStorage adapter for preferences, null for others
 *
 * preferencesAdapter is ALWAYS present (never null) — guests get localStorage.
 *
 * Must be used inside a ClerkProvider (for useAuth/useUser hooks).
 */
export function SyncProvider({ children }: SyncProviderProps) {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  // Sync offline queue auth when user signs in/out
  useEffect(() => {
    if (isSignedIn && getToken) {
      setFlushAuth(getToken);
    }
  }, [isSignedIn, getToken]);

  // Memoize adapters to avoid recreating on every render
  const value = useMemo<SyncContextValue>(() => {
    // LocalStorage adapter is always available for preferences
    const localPreferencesAdapter = createLocalStoragePreferencesAdapter();

    if (isSignedIn && user?.id && getToken) {
      const makeAnimeAdapter = supabaseAnimeFavoritesAdapterFactory();
      const makeMangaAdapter = supabaseMangaFavoritesAdapterFactory();
      const makeWatchedAdapter = supabaseEpisodeAdapterFactory();
      const makeChapterAdapter = supabaseChapterAdapterFactory();
      const makePreferencesAdapter = supabasePreferencesAdapterFactory();

      return {
        animeFavoritesAdapter: makeAnimeAdapter(user.id, getToken),
        mangaFavoritesAdapter: makeMangaAdapter(user.id, getToken),
        watchedAdapter: makeWatchedAdapter(user.id, getToken),
        readChaptersAdapter: makeChapterAdapter(user.id, getToken),
        preferencesAdapter: makePreferencesAdapter(user.id, getToken),
        isAuthenticated: true,
      };
    }

    // Guest mode: only preferences adapter (localStorage)
    return {
      animeFavoritesAdapter: null,
      mangaFavoritesAdapter: null,
      watchedAdapter: null,
      readChaptersAdapter: null,
      preferencesAdapter: localPreferencesAdapter,
      isAuthenticated: false,
    };
  }, [isSignedIn, user?.id, getToken]);

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

/**
 * Returns the current sync context value.
 * Must be used within SyncProvider.
 */
export function useSyncContext(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return ctx;
}