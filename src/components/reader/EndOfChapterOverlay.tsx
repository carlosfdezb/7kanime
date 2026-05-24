import { useEffect, useRef, useCallback } from 'react';
import { ReaderNavigation } from './ReaderNavigation';
import type { MangaChapter } from '../../types/manga';
import styles from './EndOfChapterOverlay.module.css';

interface EndOfChapterOverlayProps {
  prevChapter: MangaChapter | null;
  nextChapter: MangaChapter | null;
  currentChapter: MangaChapter | null;
  mangaId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EndOfChapterOverlay({
  prevChapter,
  nextChapter,
  currentChapter,
  mangaId,
  isOpen,
  onClose,
}: EndOfChapterOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!overlayRef.current) return [];
    const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(overlayRef.current.querySelectorAll(selector));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Focus the close button when overlay opens
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];
        const activeElement = document.activeElement;

        if (e.shiftKey) {
          if (activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, getFocusableElements]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Navegación de capítulo"
    >
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.panel}>
        <h2 className={styles.title}>Fin del capítulo</h2>
        <p className={styles.subtitle}>
          Has llegado al final del capítulo {currentChapter?.numeroCapitulo || ''}
        </p>

        <div className={styles.navigationWrapper}>
          <ReaderNavigation
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            currentChapter={currentChapter}
            mangaId={mangaId}
          />
        </div>

        <button
          ref={closeButtonRef}
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Volver a la página"
        >
          Volver a la página
        </button>
      </div>
    </div>
  );
}
