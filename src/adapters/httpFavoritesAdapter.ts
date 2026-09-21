/**
 * HTTP Favorites Adapter — talks to the lite backend.
 *
 * The backend stores payloads keyed by (device_id, anime_id). Each favorite is
 * an opaque JSON blob whose shape matches CatalogItem. This adapter is
 * isEnabled() whenever API_BASE + a device id are available.
 */

import type { SyncAdapter } from './types';
import type { CatalogItem } from '../types/api';
import { API_BASE, getDeviceId } from '../lib/config';

const ENDPOINT = `${API_BASE}/api/favorites`;

async function http<T>(path: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': getDeviceId(),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    console.warn('[httpFavoritesAdapter] HTTP', res.status, path);
    return null;
  }
  return (await res.json()) as T;
}

export function createHttpFavoritesAdapter(): SyncAdapter<CatalogItem> {
  let cache: CatalogItem[] = [];

  return {
    getAll(): CatalogItem[] {
      return cache;
    },

    upsert(item: CatalogItem): void {
      cache = [...cache.filter((c) => c.id !== item.id), item];
      void http(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ animeId: item.id, payload: item }),
      });
    },

    remove(id: string | number): void {
      cache = cache.filter((c) => c.id !== id);
      void http(`${ENDPOINT}/${id}`, { method: 'DELETE' });
    },

    async hydrate(): Promise<void> {
      const data = await http<{ items: Array<{ animeId: number; payload: CatalogItem }> }>(ENDPOINT);
      cache = (data?.items ?? [])
        .map((row) => row.payload)
        .filter((p): p is CatalogItem => !!p && typeof p === 'object');
    },

    isEnabled(): boolean {
      return Boolean(API_BASE && getDeviceId());
    },
  };
}
