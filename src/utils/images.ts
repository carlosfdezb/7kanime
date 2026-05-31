import type { AnimeDetail, CatalogItem } from '../types/api';
import type { MangaDetail, MangaItem, MangaFavorite } from '../types/manga';

export type ImagePurpose = 'backdrop' | 'poster' | 'card' | 'thumbnail';

export function resolveAnimeImage(
  anime: AnimeDetail | CatalogItem,
  purpose: ImagePurpose
): string | null {
  if (purpose === 'backdrop') {
    const detail = anime as AnimeDetail;
    return detail.anilist?.bannerImage || detail.backdrop || detail.poster || null;
  }
  if (purpose === 'poster') {
    const detail = anime as AnimeDetail;
    return detail.anilist?.coverImage?.extraLarge || detail.anilist?.coverImage?.large || detail.poster || null;
  }
  // card, thumbnail
  return anime.poster || null;
}

export function resolveMangaImage(
  manga: MangaDetail | MangaItem | MangaFavorite,
  purpose: ImagePurpose
): string | null {
  if (purpose === 'backdrop') {
    const detail = manga as MangaDetail;
    return detail.anilist?.bannerImage || detail.coverUrl || null;
  }
  if (purpose === 'poster') {
    const detail = manga as MangaDetail;
    return detail.anilist?.coverImage?.extraLarge || detail.anilist?.coverImage?.large || detail.coverUrl || null;
  }
  // card, thumbnail
  return manga.coverUrl || null;
}
