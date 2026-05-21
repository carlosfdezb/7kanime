/**
 * LocalStorage Preferences Adapter
 *
 * Persists user preferences to localStorage for guest users.
 * Implements the SyncAdapter contract for preferences.
 *
 * Key: '7kanime-preferences'
 */

import type { SyncAdapter } from './types';
import type { UserPreferences } from '../types/preferences';
import { DEFAULT_PREFERENCES } from '../types/preferences';

const STORAGE_KEY = '7kanime-preferences';

function loadFromStorage(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return JSON.parse(raw) as UserPreferences;
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function saveToStorage(preferences: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (e) {
    console.warn('[localStoragePreferencesAdapter] save failed:', e);
  }
}

/**
 * Creates a localStorage-based adapter for user preferences.
 * Always enabled — works for guests and authenticated users alike.
 */
export function createLocalStoragePreferencesAdapter(): SyncAdapter<UserPreferences> {
  return {
    getAll(): UserPreferences[] {
      const data = loadFromStorage();
      return [data];
    },

    upsert(item: UserPreferences): void {
      saveToStorage(item);
    },

    remove(_id: string | number): void {
      // Preferences are a single record — remove clears to defaults
      localStorage.removeItem(STORAGE_KEY);
    },

    async hydrate(): Promise<void> {
      // localStorage is already in sync — no-op
      return Promise.resolve();
    },

    isEnabled(): boolean {
      return true;
    },
  };
}