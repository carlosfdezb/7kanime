import { useMemo } from 'react';
import { useReadChaptersStore } from '../store/readChaptersStore';

export interface RecentManga {
  mangaId: string;
  mangaTitle: string;
  coverUrl: string;
  readCount: number;
  lastReadAt: string;
}

export function useContinueReading() {
  const { readChapters } = useReadChaptersStore();

  const recentMangas = useMemo(() => {
    const entries = Object.entries(readChapters);
    if (entries.length === 0) return [];

    return entries
      .map(([mangaId, data]) => ({
        mangaId,
        mangaTitle: data.manga_title,
        coverUrl: data.cover_url,
        readCount: data.hashes.length,
        lastReadAt: data.lastReadAt ?? '',
      }))
      .filter((item) => item.mangaTitle && item.coverUrl)
      .sort((a, b) => {
        const aTime = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
        const bTime = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [readChapters]);

  return { recentMangas };
}
