import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface TVFocusContextValue {
  isTVMode: boolean;
  enableTVMode: () => void;
  disableTVMode: () => void;
  toggleTVMode: () => void;
}

const TVFocusContext = createContext<TVFocusContextValue | null>(null);

interface TVFocusProviderProps {
  children: ReactNode;
}

export function TVFocusProvider({ children }: TVFocusProviderProps) {
  const [isTVMode, setIsTVMode] = useState(false);

  const enableTVMode = useCallback(() => setIsTVMode(true), []);
  const disableTVMode = useCallback(() => setIsTVMode(false), []);
  const toggleTVMode = useCallback(() => setIsTVMode((prev) => !prev), []);

  return (
    <TVFocusContext.Provider
      value={{
        isTVMode,
        enableTVMode,
        disableTVMode,
        toggleTVMode,
      }}
    >
      {children}
    </TVFocusContext.Provider>
  );
}

export function useTVFocus() {
  const ctx = useContext(TVFocusContext);
  if (!ctx) {
    throw new Error('useTVFocus must be used within TVFocusProvider');
  }
  return ctx;
}
