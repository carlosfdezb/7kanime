import { apiFetch } from '../api/client';

/**
 * Prefetch anime/manga detail data on hover to warm the browser cache.
 * Uses requestIdleCallback when available, falling back to setTimeout.
 */
function prefetchWithIdleCallback(url: string) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      apiFetch(url).catch(() => {
        // Silently fail - this is just cache warming
      });
    }, { timeout: 1000 });
  } else {
    setTimeout(() => {
      apiFetch(url).catch(() => {
        // Silently fail - this is just cache warming
      });
    }, 100);
  }
}

/**
 * Prefetch anime detail when user hovers over a card.
 * Also preload the poster image.
 */
export function usePrefetchAnime() {
  return (slug: string, posterUrl?: string) => {
    prefetchWithIdleCallback(`/anime/${slug}`);

    // Preload poster image
    if (posterUrl) {
      const img = new Image();
      img.src = posterUrl;
    }
  };
}

/**
 * Prefetch manga detail when user hovers over a card.
 * Also preload the cover image.
 */
export function usePrefetchManga() {
  return (publicId: string, coverUrl?: string) => {
    prefetchWithIdleCallback(`/manga/${publicId}`);

    // Preload cover image
    if (coverUrl) {
      const img = new Image();
      img.src = coverUrl;
    }
  };
}