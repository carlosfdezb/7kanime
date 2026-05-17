import type { MangaChapter } from '../types/manga';

export interface ChapterNavInfo {
  publicId: string;
  numeroCapitulo: string;
  orden: number;
  title?: string;
}

/**
 * Sorts chapters by orden (descending — newest first).
 * In the shadowmanga API, chapters are already unique by publicId.
 */
export function sortChaptersByOrden(chapters: MangaChapter[]): ChapterNavInfo[] {
  return [...chapters]
    .sort((a, b) => b.orden - a.orden)
    .map(ch => ({
      publicId: ch.publicId,
      numeroCapitulo: ch.numeroCapitulo,
      orden: ch.orden,
      title: ch.title,
    }));
}
