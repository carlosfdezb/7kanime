import type { MangaChapter } from '../types/manga';

export interface ChapterNavInfo {
  publicId: string;
  numeroCapitulo: string;
  orden: number;
  title?: string;
}

/**
 * Sorts chapters by orden (ascending — chapter 1, 2, 3...).
 * In the shadowmanga API, chapters are already unique by publicId.
 */
export function sortChaptersByOrden(chapters: MangaChapter[]): ChapterNavInfo[] {
  return [...chapters]
    .sort((a, b) => a.orden - b.orden)
    .map(ch => ({
      publicId: ch.publicId,
      numeroCapitulo: ch.numeroCapitulo,
      orden: ch.orden,
      title: ch.title,
    }));
}
