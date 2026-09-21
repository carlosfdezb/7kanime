/**
 * User Preferences Store
 *
 * No longer a Zustand persist: the HTTP adapter is the source of truth and
 * falls back to a localStorage adapter when the API is unreachable. The
 * store keeps an in-memory mirror for components to read synchronously.
 */

import { create } from 'zustand';
import type { SyncAdapter } from '../adapters/types';
import type { ReadingMode, UserPreferences } from '../types/preferences';
import { DEFAULT_PREFERENCES } from '../types/preferences';

interface PreferencesStore {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  setReadingMode: (mode: ReadingMode, adapter?: SyncAdapter<UserPreferences>) => void;
  hydrate: (data: UserPreferences) => void;
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  preferences: { ...DEFAULT_PREFERENCES },
  loading: false,
  error: null,

  setReadingMode: (mode, adapter) => {
    const next = { ...get().preferences, readingMode: mode };
    set({ preferences: next });
    adapter?.upsert(next);
  },

  hydrate: (data) => set({ preferences: data, loading: false, error: null }),
}));