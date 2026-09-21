/**
 * Episode Watch History Store
 *
 * Public API is preserved. Adapter parameter is optional — components keep
 * working without changes. The SyncProvider wires the HTTP adapter at the
 * app root.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SyncAdapter } from '../adapters/types';

export interface WatchedAnime {
  episodes: number[];
  anime_title?: string;
  poster_url?: string;
  lastWatchedAt?: string;
  episodesCount?: number;
}

interface WatchedStore {
  watchedEpisodes: Record<string, WatchedAnime>;
  markWatched: (
    slug: string,
    episode: number,
    animeTitle?: string,
    posterUrl?: string,
    episodesCount?: number,
    adapter?: SyncAdapter<Record<string, WatchedAnime>>
  ) => void;
  markUnwatched: (slug: string, episode: number, adapter?: SyncAdapter<Record<string, WatchedAnime>>) => void;
  isWatched: (slug: string, episode: number) => boolean;
  toggleWatched: (
    slug: string,
    episode: number,
    animeTitle?: string,
    posterUrl?: string,
    episodesCount?: number,
    adapter?: SyncAdapter<Record<string, WatchedAnime>>
  ) => void;
  hydrate: (data: Record<string, WatchedAnime>) => void;
}

export const useWatchedStore = create<WatchedStore>()(
  persist(
    (set, get) => ({
      watchedEpisodes: {} as Record<string, WatchedAnime>,

      markWatched: (slug, episode, animeTitle, posterUrl, episodesCount, adapter) => {
        set((state) => {
          const existing = state.watchedEpisodes[slug] ?? {
            episodes: [] as number[],
            anime_title: '',
            poster_url: '',
          };
          const episodesArr = Array.isArray(existing.episodes) ? existing.episodes : [];
          if (episodesArr.includes(episode)) return state;
          const next: WatchedAnime = {
            ...existing,
            episodes: [...episodesArr, episode].sort((a, b) => a - b),
            anime_title: animeTitle ?? existing.anime_title,
            poster_url: posterUrl ?? existing.poster_url,
            episodesCount: episodesCount ?? existing.episodesCount,
            lastWatchedAt: new Date().toISOString(),
          };
          const nextRecord = { ...state.watchedEpisodes, [slug]: next };
          adapter?.upsert(nextRecord);
          return { watchedEpisodes: nextRecord };
        });
      },

      markUnwatched: (slug, episode, adapter) => {
        set((state) => {
          const existing = state.watchedEpisodes[slug];
          if (!existing) return state;
          const next: WatchedAnime = {
            ...existing,
            episodes: (existing.episodes ?? []).filter((e) => e !== episode),
          };
          const nextRecord = { ...state.watchedEpisodes, [slug]: next };
          adapter?.upsert(nextRecord);
          return { watchedEpisodes: nextRecord };
        });
      },

      isWatched: (slug, episode) => {
        const data = get().watchedEpisodes[slug];
        return data?.episodes?.includes(episode) ?? false;
      },

      toggleWatched: (slug, episode, animeTitle, posterUrl, episodesCount, adapter) => {
        if (get().isWatched(slug, episode)) {
          get().markUnwatched(slug, episode, adapter);
        } else {
          get().markWatched(slug, episode, animeTitle, posterUrl, episodesCount, adapter);
        }
      },

      hydrate: (data) => set({ watchedEpisodes: data }),
    }),
    {
      name: 'animeav1-watched',
      partialize: (state) => ({ watchedEpisodes: state.watchedEpisodes }),
    }
  )
);