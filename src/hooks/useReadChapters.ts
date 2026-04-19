import { useCallback } from 'react';
import { useReadChaptersStore } from '../store/readChaptersStore';

export function useReadChapters(mangaId: number) {
  const storeReadChapters = useReadChaptersStore(s => s.readChapters);

  // Select only this manga's read chapters — returns undefined if none
  // Do NOT use `|| []` here — that creates a NEW array reference on every call,
  // causing unnecessary re-renders in consumers.
  const readChapters = storeReadChapters[mangaId];

  const markChapterAsRead = useCallback((chapterHash: string) => {
    useReadChaptersStore.getState().markAsRead(mangaId, chapterHash);
  }, [mangaId]);

  const removeChapterFromRead = useCallback((chapterHash: string) => {
    useReadChaptersStore.getState().removeFromRead(mangaId, chapterHash);
  }, [mangaId]);

  const isChapterReadByHash = useCallback((versionHashes: string[]) => {
    return useReadChaptersStore.getState().isChapterRead(mangaId, versionHashes);
  }, [mangaId]);

  const getReadHashesForManga = useCallback(() => {
    return useReadChaptersStore.getState().getReadHashes(mangaId);
  }, [mangaId]);

  return {
    readChapters: readChapters ?? [],
    markAsRead: markChapterAsRead,
    removeFromRead: removeChapterFromRead,
    isChapterRead: isChapterReadByHash,
    getReadHashes: getReadHashesForManga,
    clearMangaRead: () => useReadChaptersStore.getState().clearMangaRead(mangaId),
  };
}
