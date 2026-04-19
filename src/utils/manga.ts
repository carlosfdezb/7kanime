import type { MangaChapter, ChapterVersion } from '../types/manga';

export interface UniqueChapter {
  number: string;
  title: string | null;
  hash: string;
  versions: ChapterVersion[];
}

/**
 * Builds a de-duplicated list of chapters by chapter number.
 * When multiple versions exist for the same chapter number,
 * the first version's hash is used as canonical.
 */
export function buildUniqueChapterList(chapters: MangaChapter[]): UniqueChapter[] {
  const seen = new Map<string, UniqueChapter>();
  for (const chapter of chapters) {
    if (!seen.has(chapter.number)) {
      seen.set(chapter.number, {
        number: chapter.number,
        title: chapter.title,
        hash: chapter.versions[0]?.hash ?? '',
        versions: chapter.versions,
      });
    }
  }
  return Array.from(seen.values());
}
