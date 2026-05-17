/**
 * Hydrate all Zustand stores from Supabase after authentication.
 *
 * Called once on isSignedIn change to true (after migration or if already migrated).
 * Each store fetches its remote data and replaces local state.
 *
 * This module is isolated to avoid circular imports between stores and adapters.
 *
 * @param supabase - Supabase client (can be Clerk-backed or legacy getSupabase())
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { useFavoritesStore } from './favoritesStore';
import { useMangaFavoritesStore } from './mangaFavoritesStore';
import { useWatchedStore } from './watchedStore';
import { useReadChaptersStore } from './readChaptersStore';

/**
 * Hydrates all 4 stores from Supabase in parallel.
 * Gracefully handles cases where Supabase is unavailable (returns early).
 */
export async function hydrateAllStores(supabase: SupabaseClient | null): Promise<void> {
  if (!supabase) return;

  await Promise.allSettled([
    hydrateFavorites(supabase),
    hydrateMangaFavorites(supabase),
    hydrateWatched(supabase),
    hydrateReadChapters(supabase),
  ]);
}

async function hydrateFavorites(supabase: SupabaseClient): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('anime_favorites')
      .select('anime_id, title, anime_slug, poster_url, type');

    if (error) {
      console.warn('[hydrateFavorites] failed:', error.message);
      return;
    }

    if (!data || data.length === 0) return;

    // Map rows back to CatalogItem shape
    const items = data.map(row => ({
      id: row.anime_id as number,
      title: row.title as string,
      slug: row.anime_slug as string,
      poster: row.poster_url as string,
      type: row.type as string,
      typeSlug: (row.type as string)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''),
      synopsis: '', // Not stored in Supabase, only needed for display
    }));

    useFavoritesStore.getState().hydrate(items);
  } catch (e) {
    console.warn('[hydrateFavorites] error:', e);
  }
}

async function hydrateMangaFavorites(supabase: SupabaseClient): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('manga_favorites')
      .select('manga_id, title, cover_url, type');

    if (error) {
      console.warn('[hydrateMangaFavorites] failed:', error.message);
      return;
    }

    if (!data || data.length === 0) return;

    const items = data.map(row => ({
      publicId: row.manga_id as string,
      title: row.title as string,
      coverUrl: row.cover_url as string,
      type: row.type as string,
    }));

    useMangaFavoritesStore.getState().hydrate(items);
  } catch (e) {
    console.warn('[hydrateMangaFavorites] error:', e);
  }
}

async function hydrateWatched(supabase: SupabaseClient): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('episode_history')
      .select('anime_slug, anime_title, poster_url, episode_number');

    if (error) {
      console.warn('[hydrateWatched] failed:', error.message);
      return;
    }

    if (!data || data.length === 0) return;

    // Group by slug: { "slug": { episodes: [1, 2, 3], anime_title: "", poster_url: "" } }
    const grouped: Record<string, { episodes: number[]; anime_title: string; poster_url: string }> = {};
    for (const row of data) {
      const slug = row.anime_slug as string;
      const episode = row.episode_number as number;
      const animeTitle = (row.anime_title as string) || slug;
      const posterUrl = (row.poster_url as string) || '';
      if (!grouped[slug]) {
        grouped[slug] = { episodes: [], anime_title: animeTitle, poster_url: posterUrl };
      }
      if (!grouped[slug].episodes.includes(episode)) {
        grouped[slug].episodes.push(episode);
      }
    }

    // Sort episode arrays
    for (const slug of Object.keys(grouped)) {
      grouped[slug].episodes.sort((a, b) => a - b);
    }

    useWatchedStore.getState().hydrate(grouped);
  } catch (e) {
    console.warn('[hydrateWatched] error:', e);
  }
}

async function hydrateReadChapters(supabase: SupabaseClient): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('chapter_history')
      .select('manga_id, manga_title, cover_url, chapter_id');

    if (error) {
      console.warn('[hydrateReadChapters] failed:', error.message);
      return;
    }

    if (!data || data.length === 0) return;

    // Group by mangaId: { mangaId: { hashes: [hash1, hash2], manga_title: "", cover_url: "" } }
    const grouped: Record<string, { hashes: string[]; manga_title: string; cover_url: string }> = {};
    for (const row of data) {
      const mangaId = row.manga_id as string;
      const hash = row.chapter_id as string;
      const mangaTitle = (row.manga_title as string) || '';
      const coverUrl = (row.cover_url as string) || '';
      if (!grouped[mangaId]) {
        grouped[mangaId] = { hashes: [], manga_title: mangaTitle, cover_url: coverUrl };
      }
      if (!grouped[mangaId].hashes.includes(hash)) {
        grouped[mangaId].hashes.push(hash);
      }
    }

    useReadChaptersStore.getState().hydrate(grouped);
  } catch (e) {
    console.warn('[hydrateReadChapters] error:', e);
  }
}
