import { useCallback } from 'react';
import { useReadChaptersStore } from '../store/readChaptersStore';
import { useSyncContext } from '../context/SyncContext';

export function useReadChapters(mangaId: number) {
  const store = useReadChaptersStore();
  const { readChaptersAdapter, isAuthenticated } = useSyncContext();

  // Select only this manga's read chapters
  const readChapters = store.readChapters[mangaId]?.hashes ?? [];

  const markAsRead = useCallback((chapterHash: string, chapterNum?: string, mangaTitle?: string, coverUrl?: string) => {
    store.markAsRead(mangaId, chapterHash, chapterNum, mangaTitle, coverUrl, readChaptersAdapter ?? undefined);
  }, [store, mangaId, readChaptersAdapter]);

  const removeFromRead = useCallback((chapterHash: string) => {
    store.removeFromRead(mangaId, chapterHash, readChaptersAdapter ?? undefined);
  }, [store, mangaId, readChaptersAdapter]);

  const isChapterRead = useCallback((versionHashes: string[]) => {
    return store.isChapterRead(mangaId, versionHashes);
  }, [store, mangaId]);

  const getReadHashes = useCallback(() => {
    return store.getReadHashes(mangaId);
  }, [store, mangaId]);

  const clearMangaRead = useCallback(() => {
    store.clearMangaRead(mangaId, readChaptersAdapter ?? undefined);
  }, [store, mangaId, readChaptersAdapter]);

  return {
    readChapters,
    markAsRead,
    removeFromRead,
    isChapterRead,
    getReadHashes,
    clearMangaRead,
    isAuthenticated,
  };
}
