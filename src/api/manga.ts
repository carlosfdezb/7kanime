import { apiFetch } from './client';
import type { MangaDetail, ChapterPages, PopularMangaResponse, MangaSearchResponse, MangaTag } from '../types/manga';

export async function getPopular(page: number): Promise<PopularMangaResponse> {
  return apiFetch<PopularMangaResponse>(`/manga/popular?page=${page}`);
}

export async function getTags(): Promise<MangaTag[]> {
  return apiFetch<MangaTag[]>(`/manga/tags`);
}

export async function searchManga(query: string): Promise<MangaSearchResponse> {
  return apiFetch<MangaSearchResponse>(`/manga/search?q=${encodeURIComponent(query)}`);
}

export async function getMangaDetail(publicId: string): Promise<MangaDetail> {
  return apiFetch<MangaDetail>(`/manga/${publicId}`);
}

export async function getChapterPages(serieId: string, capituloId: string): Promise<ChapterPages> {
  return apiFetch<ChapterPages>(`/manga/chapter/${serieId}/${capituloId}`);
}
