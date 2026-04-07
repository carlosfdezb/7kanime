import { apiFetch } from './client';
import type { AnimeDetail } from '../types/api';

export async function getAnime(slug: string): Promise<AnimeDetail> {
  return apiFetch<AnimeDetail>(`/anime/${slug}`);
}
