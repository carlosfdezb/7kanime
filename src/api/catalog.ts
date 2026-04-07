import { apiFetch } from './client';
import type { CatalogResponse, CatalogParams } from '../types/api';

export async function getCatalog(params: CatalogParams): Promise<CatalogResponse> {
  const qs = new URLSearchParams();
  
  if (params.page) qs.set('page', String(params.page));
  if (params.letter) qs.set('letter', params.letter);
  if (params.genre) qs.set('genre', params.genre);
  if (params.type) qs.set('type', params.type);
  if (params.year) qs.set('year', String(params.year));
  if (params.status) qs.set('status', params.status);
  
  const queryString = qs.toString();
  const endpoint = queryString ? `/catalog?${qs}` : '/catalog';
  
  return apiFetch<CatalogResponse>(endpoint);
}
