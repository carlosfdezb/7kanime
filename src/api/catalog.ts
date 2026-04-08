import { apiFetch } from './client';
import type { CatalogResponse, CatalogParams } from '../types/api';

export async function getCatalog(params: CatalogParams): Promise<CatalogResponse> {
  const qs = new URLSearchParams();
  
  if (params.page) qs.set('page', String(params.page));
  if (params.letter) qs.set('letter', params.letter);
  if (params.genre) qs.set('genre', params.genre);
  if (params.category) qs.set('category', params.category);
  if (params.minYear) qs.set('minYear', String(params.minYear));
  if (params.maxYear) qs.set('maxYear', String(params.maxYear));
  if (params.status) qs.set('status', params.status);
  
  const queryString = qs.toString();
  const endpoint = queryString ? `/catalog?${qs}` : '/catalog';
  
  return apiFetch<CatalogResponse>(endpoint);
}
