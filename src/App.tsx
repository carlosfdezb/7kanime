import { Routes, Route } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Home } from "./pages/Home";
import { AnimeDetail } from "./pages/AnimeDetail";
import { Episode } from "./pages/Episode";
import { NotFound } from "./pages/NotFound";
import { EasterEgg } from "./components/layout/EasterEgg";
import { useTVFocus } from "./context/TVFocusContext";
import { MangaLibrary } from "./pages/MangaLibrary";
import { MangaDetail } from "./pages/MangaDetail";
import { ChapterReader } from "./pages/ChapterReader";

const KONAMI = "seryiprestaelculo";
const KONAMI_LEN = 17;

function App() {
    const [showEasterEgg, setShowEasterEgg] = useState(false);
    const bufferRef = useRef("");
    const { toggleTVMode } = useTVFocus();

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
        <>
            {showEasterEgg && (
                <EasterEgg onClose={() => setShowEasterEgg(false)} />
            )}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/anime/:slug" element={<AnimeDetail />} />
                <Route path="/episode/:slug/:number" element={<Episode />} />
                <Route path="/manga" element={<MangaLibrary />} />
                <Route path="/manga/:id" element={<MangaDetail />} />
                <Route path="/manga/:id/chapter/:hash" element={<ChapterReader />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
}

export default App;
