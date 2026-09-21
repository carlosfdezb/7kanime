/**
 * HTTP Watched Adapter — talks to the lite backend.
 *
 * Stores per-anime watched state (Record<slug, WatchedPayload>) under
 * /api/watched/:slug. Payload is opaque JSON; this adapter assumes the shape
 * already used by the front ({ episodes: number[], anime_title, poster_url,
 * lastWatchedAt }).
 */

import type { SyncAdapter } from './types';
import { API_BASE, getDeviceId } from '../lib/config';

export interface WatchedPayload {
  episodes: number[];
  anime_title?: string;
  poster_url?: string;
  lastWatchedAt?: string;
}

type StoreShape = Record<string, WatchedPayload>;

const ENDPOINT = `${API_BASE}/api/watched`;

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
    console.warn('[httpWatchedAdapter] HTTP', res.status, path);
    return null;
  }
  return (await res.json()) as T;
}

export function createHttpWatchedAdapter(): SyncAdapter<StoreShape> {
  let cache: StoreShape = {};

  return {
    getAll(): StoreShape[] {
      return [cache];
    },

    upsert(item: StoreShape): void {
      cache = item;
      // item is the full record; push each entry to its slug
      for (const [slug, payload] of Object.entries(item)) {
        if (!payload) continue;
        void http(`${ENDPOINT}/${encodeURIComponent(slug)}`, {
          method: 'PUT',
          body: JSON.stringify({ payload }),
        });
      }
    },

    remove(id: string | number): void {
      const slug = String(id);
      const { [slug]: _, ...rest } = cache;
      cache = rest;
      void http(`${ENDPOINT}/${encodeURIComponent(slug)}`, { method: 'DELETE' });
    },

    async hydrate(): Promise<void> {
      const data = await http<{ items: StoreShape }>(ENDPOINT);
      cache = data?.items ?? {};
    },

    isEnabled(): boolean {
      return Boolean(API_BASE && getDeviceId());
    },
  };
}
