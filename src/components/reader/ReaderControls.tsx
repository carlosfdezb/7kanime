import type { ReadingMode } from '../../types/preferences';
import styles from './ReaderControls.module.css';

interface ReaderControlsProps {
  readingMode: ReadingMode;
  onReadingModeChange: (mode: ReadingMode) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function ReaderControls({
  readingMode,
  onReadingModeChange,
  isFullscreen,
  onToggleFullscreen,
}: ReaderControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeButton} ${readingMode === 'cascade' ? styles.active : ''}`}
          onClick={() => onReadingModeChange('cascade')}
          title="Modo cascada"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span className={styles.modeLabel}>Cascada</span>
        </button>
        <button
          className={`${styles.modeButton} ${readingMode === 'paginated' ? styles.active : ''}`}
          onClick={() => onReadingModeChange('paginated')}
          title="Modo paginado"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="12" y1="6" x2="12" y2="18" />
          </svg>
          <span className={styles.modeLabel}>Paginado</span>
        </button>
      </div>

      <button
        className={styles.fullscreenButton}
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
      >
        {isFullscreen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </button>
    </div>
  );
}