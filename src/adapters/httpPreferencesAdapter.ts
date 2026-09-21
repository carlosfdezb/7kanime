/**
 * HTTP Preferences Adapter — talks to the lite backend.
 *
 * Single record per device under /api/preferences. Payload is opaque JSON;
 * the front currently only stores ReadingMode but the schema is generic so
 * additional fields can be added without a backend migration.
 */

import type { SyncAdapter } from './types';
import type { UserPreferences } from '../types/preferences';
import { DEFAULT_PREFERENCES } from '../types/preferences';
import { API_BASE, getDeviceId } from '../lib/config';

const ENDPOINT = `${API_BASE}/api/preferences`;

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
    console.warn('[httpPreferencesAdapter] HTTP', res.status, path);
    return null;
  }
  return (await res.json()) as T;
}

export function createHttpPreferencesAdapter(): SyncAdapter<UserPreferences> {
  let cache: UserPreferences = { ...DEFAULT_PREFERENCES };

  return {
    getAll(): UserPreferences[] {
      return [cache];
    },

    upsert(item: UserPreferences): void {
      cache = item;
      void http(ENDPOINT, {
        method: 'PUT',
        body: JSON.stringify({ payload: item }),
      });
    },

    remove(_id: string | number): void {
      cache = { ...DEFAULT_PREFERENCES };
      void http(ENDPOINT, { method: 'PUT', body: JSON.stringify({ payload: cache }) });
    },

    async hydrate(): Promise<void> {
      const data = await http<{ payload: UserPreferences | null }>(ENDPOINT);
      if (data?.payload) cache = { ...DEFAULT_PREFERENCES, ...data.payload };
    },

    isEnabled(): boolean {
      return Boolean(API_BASE && getDeviceId());
    },
  };
}
