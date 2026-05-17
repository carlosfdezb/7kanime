import { useCallback } from 'react';
import { useReadChaptersStore } from '../store/readChaptersStore';
import { useSyncContext } from '../context/SyncContext';

export function useReadChapters(mangaId: string) {
  const store = useReadChaptersStore();
  const { readChaptersAdapter, isAuthenticated } = useSyncContext();

  // Select only this manga's read chapters
  const readChapters = store.readChapters[mangaId]?.hashes ?? [];

  const markAsRead = useCallback((capituloId: string, chapterNum?: string, mangaTitle?: string, coverUrl?: string) => {
    store.markAsRead(mangaId, capituloId, chapterNum, mangaTitle, coverUrl, readChaptersAdapter ?? undefined);
  }, [store, mangaId, readChaptersAdapter]);

  const removeFromRead = useCallback((capituloId: string) => {
    store.removeFromRead(mangaId, capituloId, readChaptersAdapter ?? undefined);
  }, [store, mangaId, readChaptersAdapter]);

  const isChapterRead = useCallback((capituloIds: string[]) => {
    return store.isChapterRead(mangaId, capituloIds);
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
