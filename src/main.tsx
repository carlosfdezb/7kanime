import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { TVFocusProvider } from './context/TVFocusContext';
import { ScrollToTop } from './components/ScrollToTop';
import { SyncProvider } from './context/SyncContext';
import './styles/globals.css';

// Apply saved theme on app load (before React renders)
const storedTheme = localStorage.getItem('animeav1-theme');
if (storedTheme) {
  try {
    const parsed = JSON.parse(storedTheme);
    if (parsed.state?.theme) {
      document.documentElement.setAttribute('data-theme', parsed.state.theme);
    }
  } catch {
    // ignore parse errors - default dark theme will apply
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <TVFocusProvider>
        <SyncProvider>
          <App />
        </SyncProvider>
      </TVFocusProvider>
    </BrowserRouter>
  </StrictMode>
);
