/**
 * User Preferences Store
 *
 * Manages user reading preferences with SyncAdapter pattern.
 * - Guest mode: delegates to localStorage adapter
 * - Authenticated mode: delegates to Clerk-backed Supabase adapter
 *
 * The adapter is ALWAYS present (never null) unlike other sync adapters.
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
  hydrate: (data: UserPreferences, adapter?: SyncAdapter<UserPreferences>) => void;
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  preferences: { ...DEFAULT_PREFERENCES },
  loading: false,
  error: null,

  setReadingMode: (mode: ReadingMode, adapter?: SyncAdapter<UserPreferences>) => {
    const newPreferences = { ...get().preferences, readingMode: mode };
    set({ preferences: newPreferences });

    if (adapter) {
      adapter.upsert(newPreferences);
    }
  },

  hydrate: (data: UserPreferences, _adapter?: SyncAdapter<UserPreferences>) => {
    set({ preferences: data, loading: false, error: null });
  },
}));