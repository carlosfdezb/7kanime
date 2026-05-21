import { Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Home } from "./pages/Home";
import { AnimeDetail } from "./pages/AnimeDetail";
import { Episode } from "./pages/Episode";
import { NotFound } from "./pages/NotFound";
import { EasterEgg } from "./components/layout/EasterEgg";
import { useTVFocus } from "./context/TVFocusContext";
import { MangaLibrary } from "./pages/MangaLibrary";
import { MangaDetail } from "./pages/MangaDetail";
import { ChapterReader } from "./pages/ChapterReader";
import { Login } from "./pages/Login";
import { SyncProvider } from "./context/SyncContext";
import { hydrateAllStores, hydratePreferencesFromLocal } from "./store/syncHydration";
import { createClerkSupabaseClient } from "./lib/clerkSupabase";
import { ErrorBoundary } from "./components/ErrorBoundary";

const KONAMI = "seryiprestaelculo";
const KONAMI_LEN = 17;

function App() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const bufferRef = useRef("");
  const { toggleTVMode } = useTVFocus();
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const hasHydrated = useRef(false);

  // Hydrate preferences from localStorage on app startup (for guests and pre-auth)
  useEffect(() => {
    hydratePreferencesFromLocal();
  }, []);

  // Reset hasHydrated when user signs out, so stores re-hydrate on next login
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      hasHydrated.current = false;
    }
  }, [isLoaded, isSignedIn]);

  // Handle Clerk auth state changes — hydrate stores from Supabase on login / refresh
  useEffect(() => {
    // Wait for Clerk to finish loading before checking auth state
    if (!isLoaded || !isSignedIn || !userId) return;
    // Prevent duplicate hydration (e.g. if getToken reference changes)
    if (hasHydrated.current) return;

    const runHydration = async () => {
      try {
        // Verify we have a valid Clerk token before creating Supabase client
        const token = await getToken();
        if (!token) {
          console.warn('[App] No Clerk token available, skipping hydration');
          return;
        }
        const supabase = createClerkSupabaseClient(getToken);
        await hydrateAllStores(supabase);
        hasHydrated.current = true;
      } catch (e) {
        console.warn('[App] store hydration failed:', e);
      }
    };

    runHydration();
  }, [isLoaded, isSignedIn, userId, getToken]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
        return;

      // Ctrl+Alt+Shift+Q to toggle TV mode
      if (e.ctrlKey && e.altKey && e.shiftKey && e.key === "Q") {
        e.preventDefault();
        toggleTVMode();
        return;
      }

      const char = e.key.toLowerCase();
      // Only track alphanumeric characters to avoid breaking on Shift/special keys
      if (/^[a-z0-9]$/.test(char)) {
        bufferRef.current += char;
        if (bufferRef.current.length > KONAMI_LEN) {
          bufferRef.current = bufferRef.current.slice(-KONAMI_LEN);
        }
      }
      if (bufferRef.current === KONAMI) {
        setShowEasterEgg(true);
        bufferRef.current = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SyncProvider>
      {showEasterEgg && (
        <EasterEgg onClose={() => setShowEasterEgg(false)} />
      )}
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/anime/:slug" element={<AnimeDetail />} />
          <Route path="/episode/:slug/:number" element={<Episode />} />
          <Route path="/manga" element={<MangaLibrary />} />
          <Route path="/manga/:id" element={<MangaDetail />} />
          <Route path="/manga/:serieId/chapter/:capituloId" element={<ChapterReader />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </SyncProvider>
  );
}

export default App;