/**
 * TV Navigation Store
 *
 * Replaces window.__tvFocusedId global state with a proper Zustand store.
 * Manages focused element ID and focus history for TV/browser navigation.
 */

import { create } from 'zustand';

interface FocusHistoryEntry {
  id: string;
  timestamp: number;
}

interface TVNavigationStore {
  /** Currently focused element ID */
  focusedId: string | null;
  /** History of focused IDs for back navigation */
  focusHistory: FocusHistoryEntry[];

  /** Set the currently focused element ID */
  setFocusedId: (id: string | null) => void;
  /** Go back to previous focus (for ESC key) */
  goBack: () => string | null;
  /** Clear focus state */
  clearFocus: () => void;
}

const MAX_HISTORY = 10;

export const useTVNavigationStore = create<TVNavigationStore>((set, get) => ({
  focusedId: null,
  focusHistory: [],

  setFocusedId: (id: string | null) => {
    const { focusedId, focusHistory } = get();

    // Add current to history if it's valid and different
    if (focusedId && id !== focusedId) {
      const newHistory = [
        { id: focusedId, timestamp: Date.now() },
        ...focusHistory,
      ].slice(0, MAX_HISTORY);
      set({ focusedId: id, focusHistory: newHistory });
    } else {
      set({ focusedId: id });
    }
  },

  goBack: () => {
    const { focusHistory } = get();
    if (focusHistory.length === 0) return null;

    const [mostRecent, ...rest] = focusHistory;
    set({ focusedId: mostRecent.id, focusHistory: rest });
    return mostRecent.id;
  },

  clearFocus: () => {
    set({ focusedId: null, focusHistory: [] });
  },
}));