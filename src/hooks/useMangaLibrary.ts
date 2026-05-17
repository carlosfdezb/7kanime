import { useState, useCallback } from 'react';
import { getPopular, searchManga } from '../api/manga';
import type { MangaItem } from '../types/manga';

interface UseMangaLibraryResult {
  items: MangaItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  loading: boolean;
  error: string | null;
  fetchPage: (pageNum: number) => Promise<void>;
  fetchSearch: (query: string) => Promise<void>;
}

export function useMangaLibrary(): UseMangaLibraryResult {
  const [items, setItems] = useState<MangaItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getPopular(pageNum, 25);
      setItems(response.items || []);
      setPage(response.page);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
      setHasNextPage(response.hasNextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el catálogo de manga');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSearch = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchManga(query);
      setItems(response.items || []);
      setPage(1);
      setTotalPages(1);
      setTotalItems(response.items.length);
      setHasNextPage(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la búsqueda de manga');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    items,
    page,
    totalPages,
    totalItems,
    hasNextPage,
    loading,
    error,
    fetchPage,
    fetchSearch,
  };
}
