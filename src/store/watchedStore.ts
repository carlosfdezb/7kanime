/**
 * Episode Watch History Store
 *
 * Refactored in Phase 3 to accept sync adapter as parameter.
 * - Guest mode: delegates to localStorage adapter
 * - Authenticated mode: delegates to Clerk-backed Supabase adapter
 *
 * Public API is IDENTICAL — components see no change.
 * Components must use SyncContext and pass adapter to store actions.
 *
 * Risk 1 mitigation: anime_slug is stored denormalized in Supabase
 * to avoid needing slug→ID resolution (which may fail via catalog API).
 *
 * Phase 4: Added zustand/persist as fallback for guests when no adapter provided.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SyncAdapter } from '../adapters/types';
import type { WatchedAnime } from '../adapters/supabaseEpisodeAdapter';

interface WatchedStore {
  watchedEpisodes: Record<string, WatchedAnime>;
  markWatched: (slug: string, episode: number, animeTitle?: string, posterUrl?: string, adapter?: SyncAdapter<Record<string, WatchedAnime>>) => void;
  markUnwatched: (slug: string, episode: number, adapter?: SyncAdapter<Record<string, WatchedAnime>>) => void;
  isWatched: (slug: string, episode: number) => boolean;
  toggleWatched: (slug: string, episode: number, animeTitle?: string, posterUrl?: string, adapter?: SyncAdapter<Record<string, WatchedAnime>>) => void;
  hydrate: (data: Record<string, WatchedAnime>) => void;
}

export const useWatchedStore = create<WatchedStore>()(
  persist(
    (set, get) => ({
      watchedEpisodes: {} as Record<string, WatchedAnime>,

      markWatched: (slug: string, episode: number, animeTitle?: string, posterUrl?: string, adapter?: SyncAdapter<Record<string, WatchedAnime>>) => {
        set(state => {
          const existing = state.watchedEpisodes[slug] || { episodes: [], anime_title: '', poster_url: '' };
          const episodesArr = Array.isArray(existing.episodes) ? existing.episodes : [];
          if (!episodesArr.includes(episode)) {
            const newState = {
              watchedEpisodes: {
                ...state.watchedEpisodes,
                [slug]: {
                  episodes: [...episodesArr, episode].sort((a, b) => a - b),
                  anime_title: animeTitle ?? existing.anime_title,
                  poster_url: posterUrl ?? existing.poster_url,
                },
              },
            };

            if (adapter) {
              adapter.upsert(newState.watchedEpisodes);
            }

            return newState;
          }
          return state;
        });
      },

      markUnwatched: (slug: string, episode: number, adapter?: SyncAdapter<Record<string, WatchedAnime>>) => {
        set(state => {
          const existing = state.watchedEpisodes[slug];
          if (!existing) return state;
          const newState = {
            watchedEpisodes: {
              ...state.watchedEpisodes,
              [slug]: {
                ...existing,
                episodes: (existing.episodes ?? []).filter(e => e !== episode),
              },
            },
          };

          if (adapter) {
            adapter.upsert(newState.watchedEpisodes);
          }

          return newState;
        });
      },

      isWatched: (slug: string, episode: number) => {
        const data = get().watchedEpisodes[slug];
        return data?.episodes?.includes(episode) ?? false;
      },

      toggleWatched: (slug: string, episode: number, animeTitle?: string, posterUrl?: string, adapter?: SyncAdapter<Record<string, WatchedAnime>>) => {
        const isWatched = get().isWatched(slug, episode);
        if (isWatched) {
          get().markUnwatched(slug, episode, adapter);
        } else {
          get().markWatched(slug, episode, animeTitle, posterUrl, adapter);
        }
      },

      hydrate: (data: Record<string, WatchedAnime>) => {
        set({ watchedEpisodes: data });
      },
    }),
    {
      name: 'animeav1-guest-watched',
      partialize: (state) => ({ watchedEpisodes: state.watchedEpisodes }),
    }
  )
);