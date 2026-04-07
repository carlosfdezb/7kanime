import { apiFetch } from './client';
import type { SearchResponse } from '../types/api';

export async function search(query: string): Promise<SearchResponse> {
  const qs = new URLSearchParams({ q: query });
  return apiFetch<SearchResponse>(`/search?${qs}`);
}
