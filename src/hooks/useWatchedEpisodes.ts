import { useCallback } from 'react';
import { useWatchedStore } from '../store/watchedStore';
import { useSyncContext } from '../context/SyncContext';

export function useWatchedEpisodes() {
  const store = useWatchedStore();
  const { watchedAdapter, isAuthenticated } = useSyncContext();

  const markWatched = useCallback((slug: string, episode: number, animeTitle?: string, posterUrl?: string, episodesCount?: number) => {
    store.markWatched(slug, episode, animeTitle, posterUrl, episodesCount, watchedAdapter ?? undefined);
  }, [store, watchedAdapter]);

  const markUnwatched = useCallback((slug: string, episode: number) => {
    store.markUnwatched(slug, episode, watchedAdapter ?? undefined);
  }, [store, watchedAdapter]);

  const toggleWatched = useCallback((slug: string, episode: number, animeTitle?: string, posterUrl?: string, episodesCount?: number) => {
    store.toggleWatched(slug, episode, animeTitle, posterUrl, episodesCount, watchedAdapter ?? undefined);
  }, [store, watchedAdapter]);

  const isWatched = useCallback((slug: string, episode: number) => {
    return store.isWatched(slug, episode);
  }, [store]);

  return {
    watchedEpisodes: store.watchedEpisodes,
    markWatched,
    markUnwatched,
    toggleWatched,
    isWatched,
    isAuthenticated,
  };
}
