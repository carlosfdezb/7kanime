import { apiFetch } from './client';
import type { MangaDetail, ChapterPage, PaginatedMangaResponse } from '../types/manga';

export async function getMangaLibrary(page: number): Promise<PaginatedMangaResponse> {
  return apiFetch<PaginatedMangaResponse>(`/manga/library?page=${page}`);
}

export async function searchManga(query: string, page: number): Promise<PaginatedMangaResponse> {
  return apiFetch<PaginatedMangaResponse>(`/manga/search?q=${encodeURIComponent(query)}&page=${page}`);
}

export async function getMangaDetail(id: number): Promise<MangaDetail> {
  return apiFetch<MangaDetail>(`/manga/${id}`);
}

export async function getChapterPages(hash: string): Promise<ChapterPage> {
  return apiFetch<ChapterPage>(`/manga/chapter/${hash}`);
}

export const MANGA_PROXY_BASE = 'https://animeav1-api-server.vercel.app/manga/proxy?url=';

export function getProxiedImageUrl(url: string): string {
  return `${MANGA_PROXY_BASE}${encodeURIComponent(url)}`;
}
