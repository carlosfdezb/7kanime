import { useCallback } from 'react';
import { useWatchedStore } from '../store/watchedStore';
import { useSyncAdapters } from '../context/SyncContext';

export function useWatchedEpisodes() {
  const store = useWatchedStore();
  const { watched } = useSyncAdapters();

  const markWatched = useCallback(
    (slug: string, episode: number, animeTitle?: string, posterUrl?: string, episodesCount?: number) => {
      store.markWatched(slug, episode, animeTitle, posterUrl, episodesCount, watched);
    },
    [store, watched]
  );

  const markUnwatched = useCallback(
    (slug: string, episode: number) => {
      store.markUnwatched(slug, episode, watched);
    },
    [store, watched]
  );

  const toggleWatched = useCallback(
    (slug: string, episode: number, animeTitle?: string, posterUrl?: string, episodesCount?: number) => {
      store.toggleWatched(slug, episode, animeTitle, posterUrl, episodesCount, watched);
    },
    [store, watched]
  );

  const isWatched = useCallback(
    (slug: string, episode: number) => store.isWatched(slug, episode),
    [store]
  );

  return {
    watchedEpisodes: store.watchedEpisodes,
    markWatched,
    markUnwatched,
    toggleWatched,
    isWatched,
  };
}
