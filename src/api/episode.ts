import { apiFetch } from './client';
import type { EpisodeDetail } from '../types/api';

export async function getEpisode(slug: string, number: number): Promise<EpisodeDetail> {
  return apiFetch<EpisodeDetail>(`/episode/${slug}/${number}`);
}
