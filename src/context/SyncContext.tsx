import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import type { SyncAdapter } from '../adapters/types';
import type { CatalogItem } from '../types/api';
import type { MangaFavorite } from '../types/manga';
import { supabaseAnimeFavoritesAdapterFactory } from '../adapters/supabaseAnimeFavAdapter';
import { supabaseMangaFavoritesAdapterFactory } from '../adapters/supabaseMangaFavAdapter';
import { supabaseEpisodeAdapterFactory, type WatchedState } from '../adapters/supabaseEpisodeAdapter';
import { supabaseChapterAdapterFactory, type ReadChaptersState } from '../adapters/supabaseChapterAdapter';

interface SyncContextValue {
  animeFavoritesAdapter: SyncAdapter<CatalogItem> | null;
  mangaFavoritesAdapter: SyncAdapter<MangaFavorite> | null;
  watchedAdapter: SyncAdapter<WatchedState> | null;
  readChaptersAdapter: SyncAdapter<ReadChaptersState> | null;
  isAuthenticated: boolean;
}

const SyncContext = createContext<SyncContextValue | null>(null);

interface SyncProviderProps {
  children: ReactNode;
}

/**
 * Provides sync adapters based on authentication state.
 * When signed in: uses Clerk-backed Supabase adapters (with JWT injection)
 * When signed out: adapters are null (guest mode — no personalized data)
 *
 * Must be used inside a ClerkProvider (for useAuth/useUser hooks).
 */
export function SyncProvider({ children }: SyncProviderProps) {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  // Memoize adapters to avoid recreating on every render
  const value = useMemo<SyncContextValue>(() => {
    if (isSignedIn && user?.id && getToken) {
      const makeAnimeAdapter = supabaseAnimeFavoritesAdapterFactory();
      const makeMangaAdapter = supabaseMangaFavoritesAdapterFactory();
      const makeWatchedAdapter = supabaseEpisodeAdapterFactory();
      const makeChapterAdapter = supabaseChapterAdapterFactory();

      return {
        animeFavoritesAdapter: makeAnimeAdapter(user.id, getToken),
        mangaFavoritesAdapter: makeMangaAdapter(user.id, getToken),
        watchedAdapter: makeWatchedAdapter(user.id, getToken),
        readChaptersAdapter: makeChapterAdapter(user.id, getToken),
        isAuthenticated: true,
      };
    }

    // Guest mode: no adapters (stores stay empty)
    return {
      animeFavoritesAdapter: null,
      mangaFavoritesAdapter: null,
      watchedAdapter: null,
      readChaptersAdapter: null,
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