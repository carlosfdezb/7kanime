import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchedStore {
  watchedEpisodes: Record<string, number[]>;  // { "slug": [1, 3, 5] }
  markWatched: (slug: string, episode: number) => void;
  markUnwatched: (slug: string, episode: number) => void;
  isWatched: (slug: string, episode: number) => boolean;
  toggleWatched: (slug: string, episode: number) => void;
}

export const useWatchedStore = create<WatchedStore>()(
  persist(
    (set, get) => ({
      watchedEpisodes: {},

      markWatched: (slug: string, episode: number) => {
        set(state => {
          const episodes = state.watchedEpisodes[slug] || [];
          if (!episodes.includes(episode)) {
            return {
              watchedEpisodes: {
                ...state.watchedEpisodes,
                [slug]: [...episodes, episode].sort((a, b) => a - b),
              },
            };
          }
          return state;
        });
      },

      markUnwatched: (slug: string, episode: number) => {
        set(state => {
          const episodes = state.watchedEpisodes[slug] || [];
          return {
            watchedEpisodes: {
              ...state.watchedEpisodes,
              [slug]: episodes.filter(e => e !== episode),
            },
          };
        });
      },

      isWatched: (slug: string, episode: number) => {
        const episodes = get().watchedEpisodes[slug] || [];
        return episodes.includes(episode);
      },

      toggleWatched: (slug: string, episode: number) => {
        const isWatched = get().isWatched(slug, episode);
        if (isWatched) {
          get().markUnwatched(slug, episode);
        } else {
          get().markWatched(slug, episode);
        }
      },
    }),
    {
      name: 'animeav1-watched',
    }
  )
);
